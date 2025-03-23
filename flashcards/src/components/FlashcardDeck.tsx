import { useState, useEffect } from 'react';
import { Flashcard } from './Flashcard';
import { 
  SRSCard, 
  calculateNextReview, 
  loadSRSData, 
  saveSRSData,
  getDueCards,
  sortCardsByDueDate
} from '../utils/spacedRepetition';

interface FlashcardDeckProps {
  cards: SRSCard[];
  darkMode?: boolean;
  categoryId?: string;
}

export const FlashcardDeck = ({ 
  cards: initialCards, 
  darkMode = false,
  categoryId = 'default'
}: FlashcardDeckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState<SRSCard[]>(() => 
    loadSRSData(categoryId, initialCards)
  );
  const [isReviewingHard, setIsReviewingHard] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [reviewedCardIds, setReviewedCardIds] = useState<Set<number>>(new Set());
  const [reviewResults, setReviewResults] = useState<Record<string, number>>({
    easy: 0,
    medium: 0,
    hard: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'easy' | 'medium' | 'hard' | 'due'>('all');
  const [categoryName, setCategoryName] = useState('');
  const [useSRS, setUseSRS] = useState(true);
  const [hardCardsForReview, setHardCardsForReview] = useState<SRSCard[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Get category name from URL
  useEffect(() => {
    const path = window.location.pathname;
    const category = path.split('/').pop() || '';
    setCategoryName(category);
  }, []);

  // Get hard cards for review
  const hardCards = cards.filter(card => card.difficulty === 'hard');
  
  // Get due cards for SRS
  const dueCards = getDueCards(cards);
  
  // Apply filtering and search
  const getFilteredCards = () => {
    if (isReviewingHard) {
      return hardCards.filter(card => !reviewedCardIds.has(card.id));
    }
    
    let filtered = [...cards];
    
    // Apply difficulty/favorite filter
    if (filterType === 'favorites') {
      filtered = filtered.filter(card => card.favorite);
    } else if (filterType === 'due' && useSRS) {
      filtered = dueCards;
    } else if (filterType !== 'all') {
      filtered = filtered.filter(card => card.difficulty === filterType);
    }
    
    // Apply search filter if there's a query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        card => 
          card.front.toLowerCase().includes(query) || 
          card.back.toLowerCase().includes(query)
      );
    }
    
    // Sort by due date if using SRS
    if (useSRS && filterType === 'due') {
      return sortCardsByDueDate(filtered);
    }
    
    return filtered;
  };
  
  const currentCards = getFilteredCards();

  // Save cards data whenever it changes
  useEffect(() => {
    if (useSRS) {
      saveSRSData(categoryId, cards);
    }
  }, [cards, categoryId, useSRS]);

  // Ensure currentIndex stays within bounds of currentCards
  useEffect(() => {
    if (currentCards.length > 0 && currentIndex >= currentCards.length) {
      setCurrentIndex(0);
    }
  }, [currentCards, currentIndex]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle keyboard events if not showing review prompt or scoreboard
      if (!showReviewPrompt && !showScoreboard) {
        switch (e.code) {
          case 'Space':
            e.preventDefault(); // Prevent page scroll
            setIsFlipped(prev => !prev);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            handlePrevious();
            setIsFlipped(false); // Reset flip state
            break;
          case 'ArrowRight':
            e.preventDefault();
            handleNext();
            setIsFlipped(false); // Reset flip state
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showReviewPrompt, showScoreboard]);

  const handleNext = () => {
    // Safety check - if no cards, do nothing
    if (currentCards.length === 0) return;
    
    if (isReviewingHard) {
      if (currentCards.length <= 1) {
        // If we're on the last card, stay on this card
        // It will be removed when rated
        return;
      }
    }
    
    // In normal mode
    const nextIndex = (currentIndex + 1) % Math.max(1, currentCards.length);
    if (nextIndex === 0 && !isReviewingHard && hardCards.length > 0 && filterType === 'all' && !searchQuery) {
      // Only show review prompt if we have hard cards, in normal mode, and no filters active
      setShowReviewPrompt(true);
    } else {
      setCurrentIndex(nextIndex);
    }
    setIsFlipped(false);
  };

  const handlePrevious = () => {
    if (currentCards.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + currentCards.length) % Math.max(1, currentCards.length));
    setIsFlipped(false);
  };

  const handleDifficultySelect = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (isReviewingHard) {
      // Review mode
      const currentCard = currentCards[currentIndex];
      if (!currentCard) return; // Safety check
      
      // Update review results and mark card as reviewed in a single batch
      const updatedReviewedIds = new Set([...reviewedCardIds, currentCard.id]);
      setReviewedCardIds(updatedReviewedIds);
      setReviewResults(prev => ({
        ...prev,
        [difficulty]: prev[difficulty] + 1
      }));
      
      // Update card using SRS if enabled
      if (useSRS) {
        setCards(prevCards => prevCards.map(card => 
          card.id === currentCard.id 
            ? calculateNextReview(card, difficulty) 
            : card
        ));
      } else {
        // Traditional update without SRS
        setCards(prevCards => prevCards.map(card => 
          card.id === currentCard.id 
            ? { ...card, difficulty } 
            : card
        ));
      }
      
      // Calculate remaining cards
      const remainingCards = hardCards.filter(card => !updatedReviewedIds.has(card.id));
      
      // Check if this was the last card to review
      if (remainingCards.length === 0) {
        // No more cards to review, show scoreboard
        setIsFlipped(false);
        setShowScoreboard(true);
        saveStudySession(); // Save the study session before showing scoreboard
      } else {
        // Still have cards to review
        // Move to the next card or wrap around to the beginning
        const nextIndex = (currentIndex + 1) % remainingCards.length;
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
      }
    } else {
      // Normal mode
      if (useSRS) {
        // Use spaced repetition algorithm
        setCards(prevCards => prevCards.map(card => 
          card.id === currentCards[currentIndex].id 
            ? calculateNextReview(card, difficulty) 
            : card
        ));
      } else {
        // Traditional update without SRS
        setCards(prevCards => prevCards.map(card => 
          card.id === currentCards[currentIndex].id 
            ? { ...card, difficulty } 
            : card
        ));
      }
      
      handleNext();
      setIsFlipped(false);
    }
  };

  const handleToggleFavorite = (card?: SRSCard) => {
    if (!card) return;
    
    setCards(prevCards => prevCards.map(c => 
      c.id === card.id 
        ? { ...c, favorite: !c.favorite }
        : c
    ));
  };

  const saveStudySession = () => {
    try {
      const cardsReviewed = reviewResults.easy + reviewResults.medium + reviewResults.hard;
      
      if (cardsReviewed === 0) return; // Don't save empty sessions
      
      const session = {
        date: new Date().toISOString(),
        cardsReviewed,
        performance: { 
          easy: reviewResults.easy, 
          medium: reviewResults.medium, 
          hard: reviewResults.hard 
        },
        category: categoryName || 'General',
      };
      
      // Load existing sessions
      const savedSessions = localStorage.getItem('flashcards-study-sessions');
      let sessions = [];
      
      if (savedSessions) {
        sessions = JSON.parse(savedSessions);
      }
      
      // Add new session and save
      sessions.push(session);
      localStorage.setItem('flashcards-study-sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error("Error saving study session:", error);
    }
  };

  const handleRestart = () => {
    // Reset all cards to their initial state
    const resetCards = initialCards.map((card, index) => {
      const existingCard = cards.find(c => c.id === index + 1);
      return {
        ...card,
        id: index + 1,
        favorite: existingCard?.favorite || false,
        difficulty: undefined,
        dueDate: undefined,
        interval: undefined,
        easeFactor: undefined,
        repetitions: undefined,
        lastReviewed: undefined
      };
    });
    setCards(resetCards);
    saveSRSData(categoryId, resetCards);
  };

  // Modified handleSkipHardReview to save session
  const handleSkipHardReview = () => {
    saveStudySession();
    setShowReviewPrompt(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSearchQuery('');
    setFilterType('all');
  };

  // Handle starting hard cards review
  const handleStartHardReview = () => {
    handleReviewHardCards();
    setShowReviewPrompt(false);
  };

  // Review mode logic
  const handleReviewHardCards = () => {
    // Get all hard cards
    const hardCardsToReview = cards.filter(card => card.difficulty === 'hard');
    
    if (hardCardsToReview.length === 0) {
      setToastMessage("No hard cards to review!");
      setToastVisible(true);
      return;
    }
    
    // Reset review state
    setReviewResults({ easy: 0, medium: 0, hard: 0 });
    setReviewedCardIds(new Set());
    
    // Set hard cards for review and start review mode
    setHardCardsForReview(hardCardsToReview);
    setReviewIndex(0);
    setIsReviewingHard(true);
    setIsFlipped(false);
  };
  
  // Completely rewritten difficulty selection handler for review mode
  const handleReviewDifficultySelect = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!isReviewingHard || hardCardsForReview.length === 0) return;
    
    // Get current card being reviewed
    const currentCard = hardCardsForReview[reviewIndex];
    
    // Update review results
    setReviewResults(prev => ({
      ...prev,
      [difficulty]: prev[difficulty] + 1
    }));
    
    // Mark this card as reviewed
    setReviewedCardIds(prev => {
      const newSet = new Set(prev);
      if (currentCard && currentCard.id) {
        newSet.add(currentCard.id);
      }
      return newSet;
    });
    
    // Update card using SRS if enabled
    if (useSRS) {
      setCards(prevCards => prevCards.map(card => 
        (card.id === currentCard?.id) 
          ? calculateNextReview(card, difficulty) 
          : card
      ));
    } else {
      // Traditional update without SRS
      setCards(prevCards => prevCards.map(card => 
        (card.id === currentCard?.id)
          ? { ...card, difficulty } 
          : card
      ));
    }
    
    // Move to next card or finish review
    const nextIndex = reviewIndex + 1;
    
    if (nextIndex >= hardCardsForReview.length) {
      // Review is complete, show scoreboard
      setIsFlipped(false);
      setShowScoreboard(true);
    } else {
      // Move to next card
      setReviewIndex(nextIndex);
      setIsFlipped(false);
    }
  };
  
  // Function to retry reviewing hard cards after a review
  const handleRetryHardCards = () => {
    // Get updated hard cards (including ones that might have changed during this review)
    const updatedHardCards = cards.filter(card => card.difficulty === 'hard');
    
    if (updatedHardCards.length === 0) {
      setToastMessage("Great job! No more hard cards to review!");
      setToastVisible(true);
      setShowScoreboard(false);
      setIsReviewingHard(false);
      return;
    }
    
    // Reset review state but keep in review mode
    setReviewResults({ easy: 0, medium: 0, hard: 0 });
    setReviewedCardIds(new Set());
    setShowScoreboard(false);
    
    // Set new hard cards for review and reset index
    setHardCardsForReview(updatedHardCards);
    setReviewIndex(0);
    setIsFlipped(false);
  };
  
  // Function to exit review mode
  const handleExitReview = () => {
    setIsReviewingHard(false);
    setShowScoreboard(false);
    setReviewedCardIds(new Set());
    setReviewIndex(0);
    setHardCardsForReview([]);
  };

  // Add the Toast notification component at the end of the component
  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => {
        setToastVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastVisible]);

  // If we're in review mode
  if (isReviewingHard) {
    if (showScoreboard) {
      return (
        <div className="flex flex-col items-center gap-6 sm:gap-8 p-4 md:p-8">
          <div className={`w-full max-w-md ${darkMode ? 'text-white bg-gray-800' : 'text-gray-700 bg-white'} px-6 py-6 rounded-xl shadow-sm text-center`}>
            <p className="text-xl sm:text-2xl font-bold">Review Complete! 🎉</p>
            <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
              <p className="text-lg">Your Review Results:</p>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className={`${darkMode ? 'bg-green-900' : 'bg-green-100'} p-3 md:p-4 rounded-lg`}>
                  <p className={`${darkMode ? 'text-green-300' : 'text-green-800'} text-sm md:text-base font-semibold`}>Easy</p>
                  <p className="text-xl md:text-2xl">{reviewResults.easy}</p>
                </div>
                <div className={`${darkMode ? 'bg-yellow-900' : 'bg-yellow-100'} p-3 md:p-4 rounded-lg`}>
                  <p className={`${darkMode ? 'text-yellow-300' : 'text-yellow-800'} text-sm md:text-base font-semibold`}>Medium</p>
                  <p className="text-xl md:text-2xl">{reviewResults.medium}</p>
                </div>
                <div className={`${darkMode ? 'bg-red-900' : 'bg-red-100'} p-3 md:p-4 rounded-lg`}>
                  <p className={`${darkMode ? 'text-red-300' : 'text-red-800'} text-sm md:text-base font-semibold`}>Hard</p>
                  <p className="text-xl md:text-2xl">{reviewResults.hard}</p>
                </div>
              </div>
              <p className="text-base md:text-lg mt-2 sm:mt-4">
                You improved {reviewResults.easy + reviewResults.medium} out of {reviewResults.easy + reviewResults.medium + reviewResults.hard} cards!
              </p>
              
              {/* Message about hard cards remaining */}
              {cards.filter(card => card.difficulty === 'hard').length > 0 && (
                <div className={`mt-4 p-3 ${darkMode ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-50 text-yellow-800'} rounded-lg`}>
                  <p>You still have {cards.filter(card => card.difficulty === 'hard').length} cards marked as hard.</p>
                  <p className="mt-1">Would you like to review them again?</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleRetryHardCards}
              className={`px-4 sm:px-6 py-2 sm:py-3 ${darkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600'} text-white rounded-lg transition-colors duration-200 font-medium shadow-sm`}
            >
              Review Hard Cards Again
            </button>
            <button
              onClick={handleExitReview}
              className={`px-4 sm:px-6 py-2 sm:py-3 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors duration-200 font-medium shadow-sm`}
            >
              Exit Review
            </button>
          </div>
        </div>
      );
    }
    
    // No cards to review or invalid index
    if (hardCardsForReview.length === 0 || reviewIndex >= hardCardsForReview.length) {
      return (
        <div className="flex flex-col items-center justify-center p-4 md:p-8 text-center">
          <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'} shadow-sm max-w-md`}>
            <p className="text-xl">No hard cards to review!</p>
            <button
              onClick={handleExitReview}
              className={`mt-4 px-6 py-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors duration-200`}
            >
              Return to Deck
            </button>
          </div>
        </div>
      );
    }
    
    // Show the current card being reviewed
    const currentReviewCard = hardCardsForReview[reviewIndex];
    
    return (
      <div className="flex flex-col items-center gap-6 p-4 md:p-8 max-w-xl mx-auto">
        {/* Progress information */}
        <div className="w-full flex justify-between items-center text-sm mb-2">
          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
            Reviewing Hard Cards: {reviewIndex + 1} / {hardCardsForReview.length}
          </span>
          <button
            onClick={handleExitReview}
            className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}
          >
            Exit Review
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500"
            style={{ width: `${((reviewIndex + 1) / hardCardsForReview.length) * 100}%` }}
          />
        </div>
        
        {/* Flashcard */}
        <Flashcard
          front={currentReviewCard.front}
          back={currentReviewCard.back}
          flipped={isFlipped}
          onFlip={() => setIsFlipped(prev => !prev)}
          onDifficulty={handleReviewDifficultySelect}
          isFavorite={currentReviewCard.favorite}
          onToggleFavorite={() => handleToggleFavorite(currentReviewCard)}
          darkMode={darkMode}
        />
        
        {/* Navigation buttons */}
        <div className="w-full flex justify-center mt-4">
          <button
            onClick={() => setIsFlipped(true)}
            className={`px-6 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg transition-colors duration-200 font-medium shadow-sm`}
          >
            {isFlipped ? 'Already Flipped' : 'Flip Card'}
          </button>
        </div>
      </div>
    );
  }

  // Show review prompt
  if (showReviewPrompt) {
    return (
      <div className="flex flex-col items-center gap-6 sm:gap-8 p-4 sm:p-8">
        <div className={`w-full max-w-md ${darkMode ? 'text-white bg-gray-800' : 'text-gray-700 bg-white'} px-4 sm:px-8 py-6 rounded-xl shadow-sm text-center`}>
          <p className="text-xl sm:text-2xl font-bold">You've completed the deck! 🎉</p>
          <p className="text-base sm:text-lg mt-2">You marked {hardCards.length} cards as hard.</p>
          <p className="text-base sm:text-lg mt-2">Would you like to review them?</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={handleStartHardReview}
            className={`px-6 py-3 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors duration-200 font-medium shadow-sm`}
          >
            Review Hard Cards
          </button>
          <button
            onClick={handleSkipHardReview}
            className={`px-6 py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded-lg transition-colors duration-200 font-medium shadow-sm`}
          >
            Skip Review
          </button>
        </div>
        <button
          onClick={handleRestart}
          className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} transition-colors duration-200`}
        >
          Start New Session
        </button>
      </div>
    );
  }

  // Nothing to display if there are no cards
  if (currentCards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 sm:gap-8 p-4 sm:p-8">
        <div className={`w-full max-w-md ${darkMode ? 'text-white bg-gray-800' : 'text-gray-700 bg-white'} px-4 sm:px-8 py-6 rounded-xl shadow-sm text-center`}>
          <p className="text-xl sm:text-2xl font-bold">
            {isReviewingHard 
              ? "No hard cards to review!" 
              : filterType !== 'all' || searchQuery
                ? "No cards match your filters or search"
                : "No cards in this deck!"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {(filterType !== 'all' || searchQuery) && (
            <button
              onClick={() => { setFilterType('all'); setSearchQuery(''); }}
              className={`px-6 py-3 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors duration-200 font-medium shadow-sm`}
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={handleRestart}
            className={`px-6 py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded-lg transition-colors duration-200 font-medium shadow-sm`}
          >
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  // Toast notification
  {toastVisible && (
    <div className="fixed top-4 right-4 left-4 mx-auto max-w-sm p-4 bg-gray-800 text-white rounded-lg shadow-lg z-50 text-center">
      {toastMessage}
    </div>
  )}

  return (
    <div className="flex flex-col items-center gap-4 p-4 md:p-8 w-full max-w-4xl mx-auto">
      {/* Mode indicator and Stats button row */}
      <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {isReviewingHard ? (
            <div className={`text-sm sm:text-base font-medium ${darkMode ? 'text-red-300 bg-red-900' : 'text-red-600 bg-red-50'} px-4 py-1.5 rounded-full`}>
              Reviewing Hard Cards ({currentCards.length})
            </div>
          ) : useSRS && filterType === 'due' ? (
            <div className={`text-sm sm:text-base font-medium ${darkMode ? 'text-blue-300 bg-blue-900' : 'text-blue-600 bg-blue-50'} px-4 py-1.5 rounded-full`}>
              Due Cards: {dueCards.length}
            </div>
          ) : null}
          
          {/* SRS Toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>SRS</span>
            <button
              onClick={() => setUseSRS(prev => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                useSRS 
                  ? darkMode ? 'bg-blue-600' : 'bg-blue-500'
                  : darkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  useSRS ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Search and filter controls */}
      <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-4">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`flex-1 px-4 py-2 rounded-lg border ${
            darkMode 
              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-700 placeholder-gray-400'
          } text-base`}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className={`px-4 py-2 rounded-lg border ${
            darkMode 
              ? 'bg-gray-800 border-gray-700 text-white' 
              : 'bg-white border-gray-300 text-gray-700'
          } text-base min-w-[140px]`}
        >
          <option value="all">All Cards</option>
          <option value="favorites">Favorites</option>
          <option value="due">Due Cards</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Progress bar */}
      <div className="w-full flex items-center gap-3">
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {currentIndex + 1} / {currentCards.length}
        </span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500"
            style={{ width: `${((currentIndex + 1) / currentCards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current card */}
      <div className="w-full aspect-[3/2] min-h-[300px] sm:min-h-[400px]">
        <Flashcard
          front={currentCards[currentIndex].front}
          back={currentCards[currentIndex].back}
          flipped={isFlipped}
          onFlip={() => setIsFlipped(prev => !prev)}
          onDifficulty={handleDifficultySelect}
          isFavorite={currentCards[currentIndex].favorite}
          onToggleFavorite={() => handleToggleFavorite(currentCards[currentIndex])}
          darkMode={darkMode}
        />
      </div>

      {/* Navigation buttons */}
      <div className="w-full flex justify-between items-center mt-4">
        <button
          onClick={handlePrevious}
          className={`px-6 py-2.5 ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
          } rounded-lg transition-colors duration-200 text-base font-medium`}
        >
          Previous
        </button>
        <button
          onClick={() => setIsFlipped(prev => !prev)}
          className={`px-8 py-2.5 ${
            darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          } text-white rounded-lg transition-colors duration-200 text-base font-medium`}
        >
          {isFlipped ? 'Hide Answer' : 'Show Answer'}
        </button>
        <button
          onClick={handleNext}
          className={`px-6 py-2.5 ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
          } rounded-lg transition-colors duration-200 text-base font-medium`}
        >
          Next
        </button>
      </div>

      {/* Toast notification */}
      {toastVisible && (
        <div className="fixed top-4 right-4 left-4 mx-auto max-w-sm p-4 bg-gray-800 text-white rounded-lg shadow-lg z-50 text-center text-base">
          {toastMessage}
        </div>
      )}
    </div>
  );
}; 