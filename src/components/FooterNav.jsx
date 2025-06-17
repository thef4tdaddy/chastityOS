// src/components/FooterNav.jsx
import React, { useEffect, useState, lazy, Suspense } from 'react';

const PrivacyPage = lazy(() => import('../pages/PrivacyPage'));
const FeedbackForm = lazy(() => import('../pages/FeedbackForm'));

const FooterNav = ({ userId, googleEmail }) => {
  const isNightly = import.meta.env.VITE_ENV === 'nightly';
  const [version, setVersion] = useState('Fetching...');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    // Determine the correct API endpoint based on the environment
    const apiUrl = isNightly
      ? 'https://api.github.com/repos/thef4tdaddy/chastityOS/releases' // Fetch all releases for nightly
      : 'https://api.github.com/repos/thef4tdaddy/chastityOS/releases/latest'; // Fetch latest stable for prod

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API responded with ${res.status}`);
        return res.json();
      })
      .then((data) => {
        let releaseVersion = 'N/A';
        if (isNightly && Array.isArray(data)) {
          // If nightly, find the most recent release marked as a prerelease containing "nightly"
          const nightlyRelease = data.find(
            (release) => release.prerelease && release.tag_name.includes('nightly')
          );
          if (nightlyRelease) {
            releaseVersion = nightlyRelease.tag_name;
          }
        } else if (!isNightly && data && data.tag_name) {
          // If prod, use the tag_name from the 'latest' release
          releaseVersion = data.tag_name;
        }
        setVersion(releaseVersion);
      })
      .catch((error) => {
        console.error("Failed to fetch version:", error);
        setVersion('Error');
      });
  }, [isNightly]); // Re-run effect if isNightly changes

  // Shared classes for hover and focus effects
  const interactiveClasses = isNightly
    ? 'hover:text-green-300 focus:outline-none focus:text-green-300'
    : 'hover:text-purple-300 focus:outline-none focus:text-purple-300';
  
  // Combine the interactive classes with our new button reset class
  const buttonAsLinkClasses = `button-as-link ${interactiveClasses}`;

  return (
    <>
      <footer className="mt-8 text-center text-xs text-gray-500">
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mb-2">
          <a
            href={`https://github.com/thef4tdaddy/chastityOS/releases/tag/${version}`}
            target="_blank"
            rel="noopener noreferrer"
            className={interactiveClasses}
          >
            Version: {version}
          </a>
          <button
            type="button"
            onClick={() => setShowPrivacy(true)}
            className={buttonAsLinkClasses}
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => setShowFeedback(true)}
            className={buttonAsLinkClasses}
          >
            Feedback
          </button>
          <a
            href="https://ko-fi.com/chastityos"
            target="_blank"
            rel="noopener noreferrer"
            className={interactiveClasses}
          >
            Support on Ko-fi
          </a>
        </div>
        © {new Date().getFullYear()} ChastityOS
        {googleEmail ? (
          <div className="mt-2 text-green-400">
            Signed in with Google: {googleEmail}
          </div>
        ) : (
          <div className="mt-2 text-yellow-400">
            Anonymous session
          </div>
        )}
      </footer>

      {showPrivacy && (
        <Suspense fallback={<div className="text-white">Loading Privacy Policy...</div>}>
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-gray-800 border ${isNightly ? 'border-green-600' : 'border-purple-600'} p-6 rounded-lg max-w-xl w-full overflow-y-auto max-h-[90vh] text-left`}>
              <PrivacyPage onBack={() => setShowPrivacy(false)} />
            </div>
          </div>
        </Suspense>
      )}

      {showFeedback && (
        <Suspense fallback={<div className="text-white">Loading Feedback Form...</div>}>
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-gray-800 border ${isNightly ? 'border-green-600' : 'border-purple-600'} p-6 rounded-lg max-w-xl w-full overflow-y-auto max-h-[90vh] text-left`}>
              <FeedbackForm onBack={() => setShowFeedback(false)} userId={userId} />
            </div>
          </div>
        </Suspense>
      )}
    </>
  );
};

export default FooterNav;
