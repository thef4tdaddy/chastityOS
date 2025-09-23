// src/components/UpdatePrompt.jsx
import React from "react";

const UpdatePrompt = ({ onUpdate }) => {
  const handleUpdateClick = () => {
    // Call the onUpdate prop which triggers the service worker update.
    onUpdate();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      <div className="bg-purple-800 text-white rounded-xl shadow-2xl p-4 w-72 border-2 border-purple-500 transform transition-transform hover:scale-105">
        <div className="flex flex-col text-center">
          <h4 className="font-bold text-lg mb-2 text-purple-200">
            New Version Available!
          </h4>
          <p className="text-sm text-purple-300 mb-4">
            A new version of ChastityOS has been downloaded. Restart the app to
            apply the update.
          </p>
          <button
            onClick={handleUpdateClick}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-purple-800 focus:ring-white"
          >
            Restart & Update
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple fade-in animation for the prompt
const styles = `
@keyframes fade-in-up {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}
.animate-fade-in-up {
    animation: fade-in-up 0.5s ease-out forwards;
}
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default UpdatePrompt;
