import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

const HOW_TO_URL = 'https://raw.githubusercontent.com/thef4tdaddy/chastityOS/main/docs/how-to.md';

const HowToModal = ({ isOpen, onClose }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetch(HOW_TO_URL)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch(() => setContent('Failed to load instructions.'));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="relative bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-2xl text-gray-200 border-2 border-purple-700 max-h-[85vh] overflow-y-auto flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
          aria-label="Close modal"
        >
          <FaTimes size={22} />
        </button>
        <h2 className="text-2xl font-bold text-purple-300 mb-4 text-center">How To Use</h2>
        <div className="text-sm markdown-body">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

// Basic fade-in animation reused from other modals
const styles = `
@keyframes fade-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
    animation: fade-in 0.2s ease-out forwards;
}
`;
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default HowToModal;
