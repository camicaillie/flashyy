import { Flashcard } from '../data/flashcards';

/**
 * Spaced Repetition System (SRS) implementation
 * 
 * This system is based on the SM-2 algorithm with some modifications.
 * It schedules cards for review based on previous performance.
 */

export interface SRSCard extends Flashcard {
  id: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  // SRS specific fields
  dueDate?: Date;
  interval?: number; // in days
  easeFactor?: number; // multiplier for interval
  repetitions?: number; // number of times reviewed
  lastReviewed?: Date;
}

// Default values
const DEFAULT_EASE_FACTOR = 2.5;
const DEFAULT_INTERVAL = 1;

/**
 * Calculate the next review date for a card based on difficulty rating
 */
export const calculateNextReview = (
  card: SRSCard,
  difficulty: 'easy' | 'medium' | 'hard'
): SRSCard => {
  // Clone the card to avoid mutating the original
  const updatedCard = { ...card };
  
  // Initialize SRS values if they don't exist
  if (!updatedCard.easeFactor) updatedCard.easeFactor = DEFAULT_EASE_FACTOR;
  if (!updatedCard.interval) updatedCard.interval = DEFAULT_INTERVAL;
  if (!updatedCard.repetitions) updatedCard.repetitions = 0;
  
  // Update card's difficulty rating
  updatedCard.difficulty = difficulty;
  
  // Get current date
  const now = new Date();
  updatedCard.lastReviewed = now;
  
  // Adjust ease factor based on difficulty
  switch (difficulty) {
    case 'easy':
      updatedCard.easeFactor += 0.15;
      break;
    case 'medium':
      updatedCard.easeFactor -= 0.05;
      break;
    case 'hard':
      updatedCard.easeFactor -= 0.3;
      break;
  }
  
  // Ensure ease factor doesn't go below 1.3
  updatedCard.easeFactor = Math.max(1.3, updatedCard.easeFactor);
  
  // Calculate next interval
  if (difficulty === 'hard') {
    // If hard, reset to a shorter interval
    updatedCard.interval = Math.max(1, Math.floor(updatedCard.interval * 0.5));
  } else {
    // For easy/medium, increase the interval
    if (updatedCard.repetitions === 0) {
      updatedCard.interval = 1;
    } else if (updatedCard.repetitions === 1) {
      updatedCard.interval = 3;
    } else {
      updatedCard.interval = Math.round(updatedCard.interval * updatedCard.easeFactor);
    }
  }
  
  // Increment repetition counter
  updatedCard.repetitions += 1;
  
  // Calculate due date
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + updatedCard.interval);
  updatedCard.dueDate = dueDate;
  
  return updatedCard;
};

/**
 * Get cards that are due for review
 */
export const getDueCards = (cards: SRSCard[]): SRSCard[] => {
  const now = new Date();
  return cards.filter(card => !card.dueDate || card.dueDate <= now);
};

/**
 * Sort cards by due date (oldest first)
 */
export const sortCardsByDueDate = (cards: SRSCard[]): SRSCard[] => {
  return [...cards].sort((a, b) => {
    // Cards without due dates come first
    if (!a.dueDate) return -1;
    if (!b.dueDate) return 1;
    
    // Sort by due date (oldest first)
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
};

/**
 * Save SRS data to localStorage
 */
export const saveSRSData = (categoryId: string, cards: SRSCard[]): void => {
  const key = `flashcards-srs-${categoryId}`;
  localStorage.setItem(key, JSON.stringify(cards));
};

/**
 * Load SRS data from localStorage
 */
export const loadSRSData = (categoryId: string, defaultCards: Flashcard[]): SRSCard[] => {
  const key = `flashcards-srs-${categoryId}`;
  const savedData = localStorage.getItem(key);
  
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData) as SRSCard[];
      
      // Convert string dates back to Date objects and validate the data
      const convertedData = parsedData.map(card => {
        try {
          // Ensure required fields exist
          if (!card || typeof card.id !== 'number') {
            throw new Error('Invalid card data');
          }
          
          return {
            ...card,
            dueDate: card.dueDate ? new Date(card.dueDate) : undefined,
            lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
          };
        } catch (error) {
          console.error('Error parsing card data:', error);
          // Return null for any invalid card
          return null;
        }
      }).filter(card => card !== null) as SRSCard[]; // Remove any invalid cards
      
      // If we have valid data, return it
      if (convertedData.length > 0) {
        return convertedData;
      }
    } catch (error) {
      console.error('Error parsing SRS data:', error);
    }
  }
  
  // If no saved data or error, return default cards with SRS fields added
  return defaultCards.map((card, index) => ({
    ...card,
    id: index + 1,
  }));
}; 