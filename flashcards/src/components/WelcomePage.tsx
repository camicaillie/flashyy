import React from 'react';

interface WelcomePageProps {
  onCategorySelect: (category: string) => void;
  darkMode?: boolean;
}

export const WelcomePage = ({ onCategorySelect, darkMode = false }: WelcomePageProps) => {
  const categories = [
    { id: 'general', name: 'General Knowledge', color: darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600' },
    { id: 'science', name: 'Science', color: darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600' },
    { id: 'history', name: 'History', color: darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      <h2 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-8`}>Welcome to Flashcards!</h2>
      <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-12`}>Choose a category to start learning</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`${category.color} text-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1`}
          >
            <h3 className="text-2xl font-semibold mb-4">{category.name}</h3>
            <p className="text-white/90">Start learning {category.name.toLowerCase()}</p>
          </button>
        ))}
      </div>
    </div>
  );
}; 