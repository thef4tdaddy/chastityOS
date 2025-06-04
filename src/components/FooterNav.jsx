import React, { useEffect, useState } from 'react';
import PrivacyPage from '../pages/PrivacyPage'; // Path assumes PrivacyPage.jsx is in src/pages/
import FeedbackForm from '../pages/FeedbackForm'; // Path assumes FeedbackForm.jsx is in src/pages/

const FooterNav = ({ userId }) => { // Added userId prop
  const [version, setVersion] = useState('Fetching...'); // Initial state
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    fetch('https://api.github.com/repos/thef4tdaddy/chastityOS/releases/latest')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`GitHub API responded with ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.tag_name) {
          setVersion(data.tag_name);
        } else {
          setVersion('N/A'); // Handle cases where tag_name might be missing
        }
      })
      .catch((error) => {
        console.error("Failed to fetch version:", error);
        setVersion('Error'); // Indicate error fetching version
      });
  }, []);

  return (
    <>
      <footer className="mt-8 text-center text-xs text-gray-500">
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mb-2">
          <a
            href="https://github.com/thef4tdaddy/chastityOS/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-300"
          >
            Version: {version}
          </a>
          <button
            type="button"
            onClick={() => setShowPrivacy(true)}
            className="hover:text-purple-300"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => setShowFeedback(true)}
            className="hover:text-purple-300"
          >
            Feedback
          </button>
          <a
            href="https://ko-fi.com/chastityos" // Update if this is your actual Ko-fi link
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-300"
          >
            Support on Ko-fi
          </a>
        </div>
        © {new Date().getFullYear()} ChastityOS
      </footer>

      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-purple-600 p-6 rounded-lg max-w-xl w-full overflow-y-auto max-h-[90vh] text-left">
            <PrivacyPage onBack={() => setShowPrivacy(false)} />
          </div>
        </div>
      )}

      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-purple-600 p-6 rounded-lg max-w-xl w-full overflow-y-auto max-h-[90vh] text-left">
            <FeedbackForm onBack={() => setShowFeedback(false)} userId={userId} /> {/* Passed userId */}
          </div>
        </div>
      )}
    </>
  );
};

export default FooterNav;