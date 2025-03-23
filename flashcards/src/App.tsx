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
    <div className={`min-h-screen w-full transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-b from-gray-50 to-gray-100'}`}>
      <header className={`${darkMode ? 'bg-gray-800 shadow-gray-900' : 'bg-white shadow-sm'} transition-colors duration-200`}>
        <div className="container mx-auto py-6 px-4">
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Flashcards App</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
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