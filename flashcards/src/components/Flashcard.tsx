// import React from 'react';

interface FlashcardProps {
  front: string;
  back: string;
  onDifficultySelect: (difficulty: 'easy' | 'medium' | 'hard') => void;
  isFlipped: boolean;
  onFlip: () => void;
  isFavorite?: boolean;
  onToggleFavorite: () => void;
  darkMode?: boolean;
}

export const Flashcard = ({ 
  front, 
  back, 
  onDifficultySelect, 
  isFlipped, 
  onFlip,
  isFavorite = false,
  onToggleFavorite,
  darkMode = false
}: FlashcardProps) => {
  // Safety check to prevent errors with undefined content
  const safeContent = {
    front: typeof front === 'string' ? front : 'Card content not available',
    back: typeof back === 'string' ? back : 'Card content not available'
  };

  return (
    <div className="relative">
      <div
        className="relative w-96 h-56 cursor-pointer"
        onClick={!isFlipped ? onFlip : undefined}
      >
        <div
          className={`absolute w-full h-full transition-transform duration-500 ${
            isFlipped ? 'rotate-y-180' : ''
          } transform-style-preserve-3d`}
        >
          {/* Front of card */}
          <div className={`absolute w-full h-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 backface-hidden flex items-center justify-center`}>
            <p className={`text-xl text-center font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{safeContent.front}</p>
            
            {/* Favorite button (front) */}
            <button 
              className="absolute top-3 right-3"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              {isFavorite ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Back of card */}
          <div className={`absolute w-full h-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 backface-hidden rotate-y-180 flex flex-col`}>
            <p className={`text-lg text-center font-medium mb-auto ${darkMode ? 'text-white' : 'text-gray-800'}`}>{safeContent.back}</p>
            
            {/* Favorite button (back) */}
            <button 
              className="absolute top-3 right-3"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              {isFavorite ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Difficulty buttons - only show when card is flipped */}
      {isFlipped && (
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => {
              onDifficultySelect('hard');
            }}
            className={`px-6 py-2 ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white rounded-lg transition-colors duration-200 font-medium shadow-sm`}
          >
            Hard
          </button>
          <button
            onClick={() => {
              onDifficultySelect('medium');
            }}
            className={`px-6 py-2 ${darkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600'} text-white rounded-lg transition-colors duration-200 font-medium shadow-sm`}
          >
            Medium
          </button>
          <button
            onClick={() => {
              onDifficultySelect('easy');
            }}
            className={`px-6 py-2 ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg transition-colors duration-200 font-medium shadow-sm`}
          >
            Easy
          </button>
        </div>
      )}
    </div>
  );
}; 