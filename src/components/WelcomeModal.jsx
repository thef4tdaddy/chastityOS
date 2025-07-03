import React from 'react';

const HOW_TO_URL = 'https://github.com/thef4tdaddy/chastityOS#readme';

const WelcomeModal = ({ isOpen, onAccept, onShowLegal, onShowHowTo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md border-2 border-purple-700 text-gray-200 text-center">
        <h2 className="text-xl font-bold text-purple-300 mb-4">Welcome to ChastityOS</h2>
        <p className="mb-2 text-sm">
          This application is intended for consenting adults <strong>18+</strong> only.
        </p>
        <p className="mb-4 text-sm">
          One shared account is used by both the submissive and keyholder.  Separate accounts will be introduced in the future.
        </p>
        <a
          href={HOW_TO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-300 underline text-sm block mb-2"
        >
          How to Use ChastityOS
        </a>
        <button
          type="button"
          onClick={onShowLegal}
          className="text-purple-300 underline text-sm mb-4"
        >
          View Terms &amp; Disclaimer
        </button>
        <button
          type="button"
          onClick={onShowHowTo}
          className="text-purple-300 underline text-sm mb-4"
        >
          How to Use ChastityOS
        </button>
        <button
          onClick={onAccept}
          className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          I am 18+ and Accept
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
