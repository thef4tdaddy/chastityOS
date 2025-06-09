import React, { useState, useEffect } from 'react';

const MainNav = ({ currentPage, setCurrentPage }) => {
  // Removed "Privacy" from navItems
  const navItems = [
    { id: 'tracker', name: 'Chastity Tracker' },
    { id: 'logEvent', name: 'Log Event' },
    { id: 'fullReport', name: 'Full Report' },
    { id: 'rewards', name: 'Rewards/Punishments' },
    { id: 'settings', name: 'Settings' },
    // { id: 'privacy', name: 'Privacy' }, // Privacy removed from main navigation
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
          {navItems.map((page) => (
            <option key={page.id} value={page.id}>
              {page.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex flex-wrap justify-center space-x-1 sm:space-x-2">
          {navItems.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setCurrentPage(page.id)}
              className={`py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-75 ${
                currentPage === page.id
                  ? 'bg-purple-600 text-white shadow-lg transform scale-105 focus:ring-purple-400'
                  : 'bg-gray-700 text-purple-300 hover:bg-purple-500 hover:text-white hover:shadow-md focus:ring-purple-500'
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
