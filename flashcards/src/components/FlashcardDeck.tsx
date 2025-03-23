import { useState, useEffect } from 'react';
import { Flashcard } from './Flashcard';
import { StudyStats } from './StudyStats';
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
  const [showStats, setShowStats] = useState(false);
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
      
      // Update review results
      setReviewResults(prev => ({
        ...prev,
        [difficulty]: prev[difficulty] + 1
      }));
      
      // Mark this card as reviewed
      setReviewedCardIds(prev => {
        const newSet = new Set(prev);
        newSet.add(currentCard.id);
        return newSet;
      });
      
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
      
      // Calculate remaining cards AFTER marking this one as reviewed
      const updatedReviewedIds = new Set(reviewedCardIds);
      updatedReviewedIds.add(currentCard.id);
      
      const remainingCards = hardCards.filter(card => 
        !updatedReviewedIds.has(card.id)
      );
      
      // Check if this was the last card to review
      if (remainingCards.length === 0) {
        // No more cards to review, show scoreboard
        setIsFlipped(false);
        
        // Use setTimeout to ensure state updates have completed
        setTimeout(() => {
          setShowScoreboard(true);
        }, 50);
      } else {
        // Still have cards to review
        // Adjust current index if needed
        if (currentIndex >= remainingCards.length) {
          setCurrentIndex(Math.max(0, remainingCards.length - 1));
        }
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
    // If a card is provided (from review mode), use it
    if (card) {
      setCards(prevCards => prevCards.map(c => 
        c.id === card.id ? { ...c, favorite: !c.favorite } : c
      ));
      return;
    }
    
    // Original logic for when no card is provided
    if (currentCards.length === 0 || currentIndex >= currentCards.length) return;
    
    const currentCard = currentCards[currentIndex];
    setCards(prevCards => prevCards.map(card => 
      card.id === currentCard.id ? { ...card, favorite: !card.favorite } : card
    ));
  };

  // Save study session to localStorage
  const saveStudySession = () => {
    // For review mode, use the review results
    if (isReviewingHard) {
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
      try {
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
    } else {
      // For normal mode, use the overall progress
      const easy = cards.filter(card => card.difficulty === 'easy').length;
      const medium = cards.filter(card => card.difficulty === 'medium').length;
      const hard = cards.filter(card => card.difficulty === 'hard').length;
      const cardsReviewed = easy + medium + hard;
      
      if (cardsReviewed === 0) return; // Don't save empty sessions
      
      const session = {
        date: new Date().toISOString(),
        cardsReviewed,
        performance: { easy, medium, hard },
        category: categoryName || 'General',
      };
      
      // Load existing sessions
      try {
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
    }
  };

  // Modified handleRestart to save session
  const handleRestart = () => {
    // Save current session if cards were reviewed
    if (progress.reviewed > 0) {
      saveStudySession();
    }
    
    setIsReviewingHard(false);
    setCurrentIndex(0);
    setShowReviewPrompt(false);
    setShowScoreboard(false);
    setIsFlipped(false);
    setReviewedCardIds(new Set());
    setReviewResults({ easy: 0, medium: 0, hard: 0 });
    setSearchQuery('');
    setFilterType('all');
    
    // Reset cards to initial state but keep favorites
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
  
  // Function to clear localStorage data if something is corrupted
  const clearStorageData = () => {
    localStorage.removeItem(`flashcards-srs-${categoryId}`);
    localStorage.removeItem('flashcards-study-sessions');
    
    // Reset to initial cards
    const freshCards = initialCards.map((card, index) => ({
      ...card,
      id: index + 1
    }));
    setCards(freshCards);
    
    // Reset all state
    setIsReviewingHard(false);
    setCurrentIndex(0);
    setShowReviewPrompt(false);
    setShowScoreboard(false);
    setIsFlipped(false);
    setReviewedCardIds(new Set());
    setReviewResults({ easy: 0, medium: 0, hard: 0 });
    setSearchQuery('');
    setFilterType('all');
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

  // Calculate progress
  const progress = {
    total: cards.length,
    reviewed: cards.filter(card => card.difficulty).length,
    easy: cards.filter(card => card.difficulty === 'easy').length,
    medium: cards.filter(card => card.difficulty === 'medium').length,
    hard: cards.filter(card => card.difficulty === 'hard').length,
    favorites: cards.filter(card => card.favorite).length,
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
      // Save study session when scoreboard is shown
      useEffect(() => {
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
      }, []);
      
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
    <div className="flex flex-col items-center gap-4 sm:gap-8 p-4 sm:p-8">
      {/* Mode indicator and Stats button row */}
      <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {isReviewingHard ? (
            <div className={`text-sm sm:text-lg font-medium ${darkMode ? 'text-red-300 bg-red-900' : 'text-red-600 bg-red-50'} px-3 sm:px-6 py-1 sm:py-2 rounded-full`}>
              Reviewing Hard Cards ({currentCards.length})
            </div>
          ) : useSRS && filterType === 'due' ? (
            <div className={`text-sm sm:text-lg font-medium ${darkMode ? 'text-blue-300 bg-blue-900' : 'text-blue-600 bg-blue-50'} px-3 sm:px-6 py-1 sm:py-2 rounded-full`}>
              Due Cards: {dueCards.length}
            </div>
          ) : null}
          
          {/* SRS Toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>SRS</span>
            <button
              onClick={() => setUseSRS(prev => !prev)}
              className={`relative inline-flex h-5 sm:h-6 w-9 sm:w-11 items-center rounded-full transition-colors ${
                useSRS 
                  ? darkMode ? 'bg-blue-600' : 'bg-blue-500'
                  : darkMode ? 'bg-gray-700' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 sm:h-4 w-3 sm:w-4 transform rounded-full bg-white transition-transform ${
                  useSRS ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        <button
          onClick={() => setShowStats(true)}
          className={`flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 rounded-lg ${
            darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          } text-white text-sm sm:text-base transition-colors duration-200`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          Study Stats
        </button>
      </div>

      {/* Search and filter */}
      {!isReviewingHard && (
        <div className="w-full max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div className="flex-grow">
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentIndex(0); // Reset to first card when searching
                }}
                className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border ${darkMode ? 'bg-gray-800 text-white border-gray-700 focus:ring-blue-600' : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'} rounded-lg focus:outline-none focus:ring-2`}
              />
            </div>
            <div className="flex">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as any);
                  setCurrentIndex(0); // Reset to first card when filtering
                }}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg ${darkMode ? 'bg-gray-800 text-white border-gray-700 focus:ring-blue-600' : 'bg-white text-gray-700 border-gray-300 focus:ring-blue-500'} focus:outline-none focus:ring-2`}
              >
                <option value="all">All Cards</option>
                <option value="favorites">Favorites</option>
                {useSRS && <option value="due">Due for Review</option>}
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          
          {/* Filter info */}
          {(filterType !== 'all' || searchQuery) && (
            <div className="mb-2 sm:mb-4 flex justify-between items-center">
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing: {currentCards.length} of {cards.length} cards
                {filterType !== 'all' && ` (${filterType})`}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
              <button
                onClick={() => { setFilterType('all'); setSearchQuery(''); }}
                className={`text-xs sm:text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              >
                Clear filters
              </button>
            </div>
          )}

          {/* SRS info (show due dates) */}
          {useSRS && currentCards.length > 0 && currentCards[currentIndex].dueDate && (
            <div className={`mt-1 sm:mt-2 mb-2 sm:mb-4 text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p>
                Due: {currentCards[currentIndex].dueDate.toLocaleDateString()} 
                {currentCards[currentIndex].interval && ` (Interval: ${currentCards[currentIndex].interval} days)`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full max-w-2xl">
        <div className="flex justify-between mb-1 sm:mb-2">
          <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Progress: {isReviewingHard ? `${reviewedCardIds.size} / ${hardCards.length}` : `${progress.reviewed} / ${progress.total}`} cards reviewed
          </span>
          <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {Math.round((isReviewingHard ? reviewedCardIds.size / hardCards.length : progress.reviewed / progress.total) * 100)}%
          </span>
        </div>
        <div className={`h-1 sm:h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
          <div className="flex h-full">
            <div 
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: `${(isReviewingHard ? reviewResults.easy / hardCards.length : progress.easy / progress.total) * 100}%` }}
            />
            <div 
              className="bg-yellow-500 h-full transition-all duration-300"
              style={{ width: `${(isReviewingHard ? reviewResults.medium / hardCards.length : progress.medium / progress.total) * 100}%` }}
            />
            <div 
              className="bg-red-500 h-full transition-all duration-300"
              style={{ width: `${(isReviewingHard ? reviewResults.hard / hardCards.length : progress.hard / progress.total) * 100}%` }}
            />
          </div>
        </div>
        <div className={`flex justify-between mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <span>Easy: {isReviewingHard ? reviewResults.easy : progress.easy}</span>
          <span>Medium: {isReviewingHard ? reviewResults.medium : progress.medium}</span>
          <span>Hard: {isReviewingHard ? reviewResults.hard : progress.hard}</span>
          <span>Favorites: {progress.favorites}</span>
        </div>
      </div>

      <div className={`text-lg sm:text-2xl font-bold ${darkMode ? 'text-white bg-gray-800' : 'text-gray-700 bg-white'} px-4 sm:px-6 py-1 sm:py-2 rounded-full shadow-sm`}>
        Card {currentIndex + 1} of {currentCards.length}
      </div>
      
      <div className="perspective-1000 w-full">
        <Flashcard
          front={currentCards[currentIndex].front}
          back={currentCards[currentIndex].back}
          onDifficulty={handleDifficultySelect}
          flipped={isFlipped}
          onFlip={() => setIsFlipped(prev => !prev)}
          isFavorite={currentCards[currentIndex].favorite}
          onToggleFavorite={handleToggleFavorite}
          darkMode={darkMode}
        />
      </div>

      <div className="flex gap-3 sm:gap-4">
        <button
          onClick={handlePrevious}
          className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded-lg transition-colors duration-200 font-medium shadow-sm`}
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded-lg transition-colors duration-200 font-medium shadow-sm`}
        >
          Next
        </button>
      </div>

      {/* Keyboard shortcuts help */}
      <div className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2 sm:mt-4`}>
        Keyboard shortcuts: 
        <span className={`mx-1 sm:mx-2 px-1 sm:px-2 py-0.5 sm:py-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded`}>Space</span> to flip card,
        <span className={`mx-1 sm:mx-2 px-1 sm:px-2 py-0.5 sm:py-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded`}>←</span> previous card,
        <span className={`mx-1 sm:mx-2 px-1 sm:px-2 py-0.5 sm:py-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded`}>→</span> next card
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
        {/* Restart button */}
        <button
          onClick={handleRestart}
          className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} transition-colors duration-200`}
        >
          Restart Session
        </button>
        
        {/* Reset data button */}
        <button
          onClick={clearStorageData}
          className={`px-4 py-2 text-xs sm:text-sm ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} transition-colors duration-200`}
          title="Use this if you encounter any issues with the flashcards"
        >
          Reset All Data
        </button>
      </div>

      {/* Stats modal */}
      {showStats && <StudyStats darkMode={darkMode} onClose={() => setShowStats(false)} />}
    </div>
  );
}; 