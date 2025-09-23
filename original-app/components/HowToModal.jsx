import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import ReactMarkdown from "react-markdown";

const branch =
  import.meta.env.VITE_APP_VARIANT === "nightly" ? "nightly" : "main";
const HOW_TO_URL = `https://raw.githubusercontent.com/thef4tdaddy/chastityOS/${branch}/docs/how-to.md`;

const HowToModal = ({ isOpen, onClose }) => {
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    fetch(HOW_TO_URL)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch(() => setContent("Failed to load instructions."));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="relative bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-3xl text-gray-200 border-2 border-purple-700 max-h-[85vh] overflow-y-auto flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
          aria-label="Close modal"
        >
          <FaTimes size={22} />
        </button>
        <h2 className="text-2xl font-bold text-purple-300 mb-4 text-center">
          How To Use
        </h2>
        {/* The markdown-body class is the target for our new CSS styles */}
        <div className="markdown-body">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

// This style block now contains comprehensive styling for the parsed markdown
const styles = `
@keyframes fade-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
    animation: fade-in 0.2s ease-out forwards;
}

/* --- MARKDOWN STYLING --- */
.markdown-body {
    font-size: 1rem;
    line-height: 1.6;
    color: #e2e8f0; /* text-gray-200 */
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  line-height: 1.25;
  border-bottom: 1px solid #4a5568; /* border-gray-600 */
  padding-bottom: 0.3em;
}

.markdown-body h1 { font-size: 1.875rem; } /* text-3xl */
.markdown-body h2 { font-size: 1.5rem; }   /* text-2xl */
.markdown-body h3 { font-size: 1.25rem; }  /* text-xl */

.markdown-body ul {
  list-style-type: disc;
  padding-left: 2em; /* This creates indentation */
  margin-top: 1em;
  margin-bottom: 1em;
}

/* Nested lists get a different style and are also indented */
.markdown-body ul ul {
  list-style-type: circle;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.markdown-body li {
  margin-top: 0.5em;
}

.markdown-body strong {
    font-weight: 600; /* Bolder than normal text */
}

.markdown-body p {
    margin-bottom: 1em;
}

.markdown-body code {
    background-color: #2d3748; /* bg-gray-700 */
    color: #cbd5e0; /* text-gray-300 */
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    border-radius: 6px;
}

.markdown-body hr {
    height: 0.25em;
    padding: 0;
    margin: 24px 0;
    background-color: #4a5568; /* border-gray-600 */
    border: 0;
}
`;
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default HowToModal;
