export interface Flashcard {
  front: string;
  back: string;
  favorite?: boolean;
}

export interface FlashcardSet {
  id: string;
  name: string;
  cards: Flashcard[];
}

export const flashcardSets: FlashcardSet[] = [
  {
    id: 'general',
    name: 'General Knowledge',
    cards: [
      { front: 'What is the capital of France?', back: 'Paris' },
      { front: 'Which planet is known as the Red Planet?', back: 'Mars' },
      { front: 'What is the largest mammal in the world?', back: 'Blue Whale' },
      { front: 'Who painted the Mona Lisa?', back: 'Leonardo da Vinci' },
      { front: 'What is the chemical symbol for gold?', back: 'Au' },
    ],
  },
  {
    id: 'science',
    name: 'Science',
    cards: [
      { front: 'What is the atomic number of carbon?', back: '6' },
      { front: 'What is the speed of light?', back: '299,792,458 meters per second' },
      { front: 'What is the process by which plants convert light energy into chemical energy?', back: 'Photosynthesis' },
      { front: 'What is the largest organ in the human body?', back: 'Skin' },
      { front: 'What is the chemical formula for water?', back: 'H₂O' },
    ],
  },
  {
    id: 'history',
    name: 'History',
    cards: [
      { front: 'Who was the first President of the United States?', back: 'George Washington' },
      { front: 'In which year did World War II end?', back: '1945' },
      { front: 'Who was the first Emperor of China?', back: 'Qin Shi Huang' },
      { front: 'When did the French Revolution begin?', back: '1789' },
      { front: 'Who was the first woman to win a Nobel Prize?', back: 'Marie Curie' },
    ],
  },
]; 