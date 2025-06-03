import React, { useState, useEffect } from 'react';

const MainNav = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'tracker', name: 'Chastity Tracker' },
    { id: 'logEvent', name: 'Log Event' },
    { id: 'fullReport', name: 'Full Report' },
    { id: 'settings', name: 'Settings' },
    { id: 'privacy', name: 'Privacy' },
    { id: 'feedback', name: 'Feedback' }
  ];

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <nav className="mb-6">
      {isMobile ? (
        <select
          value={currentPage}
          onChange={(e) => setCurrentPage(e.target.value)}
          className="w-full p-2 rounded-md bg-gray-700 text-purple-200"
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
              onClick={() => setCurrentPage(page.id)}
              className={`py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                currentPage === page.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-700 text-purple-300 hover:bg-purple-500 hover:text-white'
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