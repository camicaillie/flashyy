import { useEffect, useState } from 'react';

interface StudySession {
  date: string;
  cardsReviewed: number;
  performance: {
    easy: number;
    medium: number;
    hard: number;
  };
  category: string;
}

interface StudyStatsProps {
  darkMode?: boolean;
  onClose: () => void;
}

export const StudyStats = ({ darkMode = false, onClose }: StudyStatsProps) => {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [totalStats, setTotalStats] = useState({
    cardsReviewed: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    categories: new Set<string>(),
    sessionsCompleted: 0,
  });

  // Load study data from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('flashcards-study-sessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions) as StudySession[];
      setStudySessions(sessions);
      
      // Calculate total statistics
      const stats = {
        cardsReviewed: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        categories: new Set<string>(),
        sessionsCompleted: sessions.length,
      };
      
      sessions.forEach(session => {
        stats.cardsReviewed += session.cardsReviewed;
        stats.easy += session.performance.easy;
        stats.medium += session.performance.medium;
        stats.hard += session.performance.hard;
        stats.categories.add(session.category);
      });
      
      setTotalStats(stats);
    }
  }, []);

  // Function to get the date in a readable format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={`fixed inset-0 ${darkMode ? 'bg-black/70' : 'bg-black/50'} z-50 flex items-center justify-center p-4`}>
      <div className={`w-full max-w-4xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-xl shadow-xl overflow-hidden`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">Study Statistics</h2>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Total statistics */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-sm text-gray-500">Sessions</p>
                <p className="text-2xl font-bold">{totalStats.sessionsCompleted}</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-sm text-gray-500">Cards Reviewed</p>
                <p className="text-2xl font-bold">{totalStats.cardsReviewed}</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-sm text-gray-500">Categories</p>
                <p className="text-2xl font-bold">{totalStats.categories.size}</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-sm text-gray-500">Mastery Level</p>
                <p className="text-2xl font-bold">
                  {totalStats.cardsReviewed > 0 
                    ? Math.round((totalStats.easy / totalStats.cardsReviewed) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </section>

          {/* Performance distribution */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Performance Distribution</h3>
            <div className={`h-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
              {totalStats.cardsReviewed > 0 && (
                <div className="flex h-full">
                  <div 
                    className="bg-green-500 h-full"
                    style={{ width: `${(totalStats.easy / totalStats.cardsReviewed) * 100}%` }}
                  />
                  <div 
                    className="bg-yellow-500 h-full"
                    style={{ width: `${(totalStats.medium / totalStats.cardsReviewed) * 100}%` }}
                  />
                  <div 
                    className="bg-red-500 h-full"
                    style={{ width: `${(totalStats.hard / totalStats.cardsReviewed) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>Easy: {totalStats.easy} ({totalStats.cardsReviewed > 0 ? Math.round((totalStats.easy / totalStats.cardsReviewed) * 100) : 0}%)</span>
              <span>Medium: {totalStats.medium} ({totalStats.cardsReviewed > 0 ? Math.round((totalStats.medium / totalStats.cardsReviewed) * 100) : 0}%)</span>
              <span>Hard: {totalStats.hard} ({totalStats.cardsReviewed > 0 ? Math.round((totalStats.hard / totalStats.cardsReviewed) * 100) : 0}%)</span>
            </div>
          </section>

          {/* Recent sessions */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Recent Study Sessions</h3>
            {studySessions.length === 0 ? (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                You haven't completed any study sessions yet.
              </p>
            ) : (
              <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg overflow-hidden`}>
                <table className="w-full">
                  <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-right">Cards</th>
                      <th className="px-4 py-3 text-right">Easy</th>
                      <th className="px-4 py-3 text-right">Medium</th>
                      <th className="px-4 py-3 text-right">Hard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {studySessions.slice().reverse().map((session, idx) => (
                      <tr key={idx} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">{formatDate(session.date)}</td>
                        <td className="px-4 py-3">{session.category}</td>
                        <td className="px-4 py-3 text-right">{session.cardsReviewed}</td>
                        <td className="px-4 py-3 text-right text-green-500">{session.performance.easy}</td>
                        <td className="px-4 py-3 text-right text-yellow-500">{session.performance.medium}</td>
                        <td className="px-4 py-3 text-right text-red-500">{session.performance.hard}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg transition-colors duration-200`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 