import React, { useState, useEffect } from 'react';

const MainNav = ({ currentPage, setCurrentPage }) => {
  // Removed "Privacy" from navItems
  const navItems = [
    { id: 'tracker', name: 'Chastity Tracker' },
    { id: 'logEvent', name: 'Log Event' },
    { id: 'fullReport', name: 'Full Report' },
    { id: 'tasks', name: 'Tasks' },
    { id: 'keyholder', name: 'Keyholder' },
    { id: 'rewards', name: 'Rewards/Punishments' },
    { id: 'settings', name: 'Profile & Preferences' },
    { id: 'feedback', name: 'Feedback' }
  ];

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640); // Using 640px as a common breakpoint for 'sm' in Tailwind
    checkMobile(); // Check on initial render
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <nav className="mb-6">
      {isMobile ? (
        <select
          value={currentPage}
          onChange={(e) => setCurrentPage(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-700 text-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 border-gray-600 shadow-sm text-sm"
        >
          {navItems.map((page) => {
            const emojiMap = {
              tracker: '📈 ',
              logEvent: '📝 ',
              fullReport: '📊 ',
              tasks: '✅ ',
              keyholder: '🔐 ',
              rewards: '🎁 ',
              settings: '⚙️ ',
              feedback: '💬 ',
            };
            return (
              <option key={page.id} value={page.id}>
                {emojiMap[page.id] || ''}{page.name}
              </option>
            );
          })}
        </select>
      ) : (
        <div className="flex flex-wrap justify-center gap-x-1 sm:gap-x-2 gap-y-2">
          {navItems.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setCurrentPage(page.id)}
              className={`py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75 ${
                currentPage === page.id
                  ? 'bg-nightly-600 text-white shadow-lg transform scale-105 focus:ring-nightly-400 border border-transparent'
                  : 'bg-gray-700 text-nightly-300 hover:bg-nightly-500 hover:text-white hover:shadow-md focus:ring-nightly-500 border border-transparent'
              }`}
            >
              {page.name}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export default MainNav;
