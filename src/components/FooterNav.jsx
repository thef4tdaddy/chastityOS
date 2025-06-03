import React, { useEffect, useState } from 'react';
import PrivacyPage from '../pages/PrivacyPage';
import FeedbackForm from '../pages/FeedbackForm';

const FooterNav = () => {
  const [version, setVersion] = useState('...');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    fetch('https://api.github.com/repos/thef4tdaddy/chastityOS/releases/latest')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.tag_name) {
          setVersion(data.tag_name);
        }
      })
      .catch(() => setVersion('v?'));
  }, []);

  return (
    <>
      <footer className="mt-8 text-center text-xs text-gray-500">
        <div className="flex justify-center flex-wrap gap-4 mb-2">
          <a
            href="https://github.com/thef4tdaddy/chastityOS/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-300"
          >
            Version: {version}
          </a>
          <button
            onClick={() => setShowPrivacy(true)}
            className="hover:text-purple-300"
          >
            Privacy
          </button>
          <button
            onClick={() => setShowFeedback(true)}
            className="hover:text-purple-300"
          >
            Feedback
          </button>
          <a
            href="https://ko-fi.com/chastityos"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-300"
          >
            Ko-fi
          </a>
        </div>
        © 2025 ChastityOS
      </footer>

      {showPrivacy && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-purple-600 p-4 rounded-lg max-w-xl w-full">
            <PrivacyPage onBack={() => setShowPrivacy(false)} />
          </div>
        </div>
      )}

      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-purple-600 p-4 rounded-lg max-w-xl w-full">
            <FeedbackForm onBack={() => setShowFeedback(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default FooterNav;