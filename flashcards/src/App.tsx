import { useState, useEffect } from 'react';
import { FlashcardDeck } from './components/FlashcardDeck';
import { WelcomePage } from './components/WelcomePage';
import { flashcardSets, FlashcardSet, Flashcard } from './data/flashcards';
import { SRSCard } from './utils/spacedRepetition';

function App() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentSet, setCurrentSet] = useState<FlashcardSet | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  // Update localStorage and apply dark mode class
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const selectedSet = flashcardSets.find(set => set.id === categoryId);
    setCurrentSet(selectedSet || null);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCurrentSet(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Convert flashcards to SRSCard format
  const convertToSRSCards = (cards: Flashcard[]): SRSCard[] => {
    return cards.map((card, index) => ({
      id: index + 1,
      front: card.front,
      back: card.back,
      difficulty: undefined,
      favorite: false
    }));
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-gray-100'}`}>
      <header className={`${darkMode ? 'bg-gray-800 shadow-gray-900' : 'bg-white shadow-sm'} transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Flashcards App</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {selectedCategory && (
              <button
                onClick={handleBackToCategories}
                className={`px-4 py-2 ${darkMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'} 
                rounded-lg transition-colors duration-200`}
              >
                Back to Categories
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className={`max-w-7xl mx-auto py-12 ${darkMode ? 'text-white' : ''}`}>
        {selectedCategory && currentSet ? (
          <FlashcardDeck 
            cards={convertToSRSCards(currentSet.cards)} 
            darkMode={darkMode}
            categoryId={selectedCategory}
          />
        ) : (
          <WelcomePage onCategorySelect={handleCategorySelect} darkMode={darkMode} />
        )}
      </main>
    </div>
  );
}

export default App; 