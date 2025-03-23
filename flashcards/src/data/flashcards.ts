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
      { front: 'Která země se připojila k Trojitému paktu v roce 1940?\na) Československo\nb) Polsko\nc) Maďarsko\nd) Rakousko', back: 'c) Maďarsko' },
      { front: 'Kdy začala studená válka?\na) 1945\nb) 1947\nc) 1950\nd) 1960', back: 'b) 1947' },
      { front: 'Co byla Kultura a politika Khrushchova?\na) Nastolení mírové politiky a uvolnění napětí mezi Východem a Západem\nb) Příprava na jadernou válku\nc) Zhoršení vztahů mezi USA a Sovětským svazem\nd) Uzavření hranic a totalitní režim', back: 'a) Nastolení mírové politiky a uvolnění napětí mezi Východem a Západem' },
      { front: 'Kdy byla podepsána Locarnská dohoda?\na) 1919\nb) 1925\nc) 1932\nd) 1939', back: 'b) 1925' },
      { front: 'Co znamenal Pakt Molotov-Ribbentrop?\na) Spojenectví mezi Německem a Itálií\nb) Pakt mezi Německem a Sovětským svazem o neútočení a o rozdělení Polska\nc) Dohoda o rozdělení Rakouska mezi Německo a Sovětský svaz\nd) Politická dohoda o podpoře Velké Británie', back: 'b) Pakt mezi Německem a Sovětským svazem o neútočení a o rozdělení Polska' },
      { front: 'Kdo byl "muž v černém" v první světové válce?\na) Ludendorff\nb) Winston Churchill\nc) Erwin Rommel\nd) Paul von Hindenburg', back: 'd) Paul von Hindenburg' },
    ],
  },
]; 