import { useState, useEffect } from 'react';

interface FlashcardProps {
  front: string;
  back: string;
  flipped: boolean;
  onFlip: () => void;
  onDifficulty?: (difficulty: 'easy' | 'medium' | 'hard') => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  darkMode?: boolean;
}

export const Flashcard = ({
  front,
  back,
  flipped,
  onFlip,
  onDifficulty,
  isFavorite = false,
  onToggleFavorite,
  darkMode = false
}: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(flipped);
  
  // Update the flip state when the parent component changes it
  useEffect(() => {
    setIsFlipped(flipped);
  }, [flipped]);

  const handleClick = () => {
    onFlip();
  };
  
  // Safety checks for content
  const safeContent = {
    front: front || 'No content provided',
    back: back || 'No content provided'
  };

  return (
    <div className="w-full">
      <div 
        className={`flip-card w-full ${isFlipped ? 'flipped' : ''} cursor-pointer`}
        onClick={handleClick}
        style={{ height: '280px' }}
      >
        <div className="flip-card-inner">
          <div 
            className={`flip-card-front rounded-xl shadow-lg p-4 sm:p-6 ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
            } relative`}
          >
            <div className="card-content text-center overflow-auto max-h-[240px]">
              <p className="text-lg sm:text-xl whitespace-pre-wrap break-words">{safeContent.front}</p>
            </div>
            
            {/* Favorite button (front) */}
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="absolute top-2 right-2 text-yellow-500 hover:text-yellow-300"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                )}
              </button>
            )}
          </div>
          <div 
            className={`flip-card-back rounded-xl shadow-lg p-4 sm:p-6 ${
              darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
            } relative`}
          >
            <div className="card-content text-center overflow-auto max-h-[240px]">
              <p className="text-lg sm:text-xl whitespace-pre-wrap break-words">{safeContent.back}</p>
            </div>
            
            {/* Favorite button (back) */}
            {onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="absolute top-2 right-2 text-yellow-500 hover:text-yellow-300"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Difficulty buttons - only show when card is flipped */}
      {isFlipped && onDifficulty && (
        <div className="mt-4 sm:mt-6 flex justify-center gap-2 sm:gap-4">
          <button
            onClick={() => onDifficulty('easy')}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm sm:text-base transition-colors duration-200"
          >
            Easy
          </button>
          <button
            onClick={() => onDifficulty('medium')}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm sm:text-base transition-colors duration-200"
          >
            Medium
          </button>
          <button
            onClick={() => onDifficulty('hard')}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm sm:text-base transition-colors duration-200"
          >
            Hard
          </button>
        </div>
      )}
    </div>
  );
}; 