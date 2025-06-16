// src/components/FooterNav.jsx
import React, { useEffect, useState, lazy, Suspense } from 'react';

const PrivacyPage = lazy(() => import('../pages/PrivacyPage'));
const FeedbackForm = lazy(() => import('../pages/FeedbackForm'));

const FooterNav = ({ userId, googleEmail }) => {
  const [version, setVersion] = useState('Fetching...');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    fetch('https://api.github.com/repos/thef4tdaddy/chastityOS/releases/latest')
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API responded with ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data.tag_name) {
          const rawEnv = import.meta.env.VITE_ENV;
          const env = rawEnv === undefined ? 'unknown' : rawEnv;
          console.log('[FooterNav] VITE_ENV:', rawEnv);
          if (env === 'nightly' && data.tag_name.includes('nightly')) {
            setVersion(data.tag_name);
          } else {
            setVersion(`${data.tag_name} (${env})`);
          }
        } else setVersion('N/A');
      })
      .catch((error) => {
        console.error("Failed to fetch version:", error);
        setVersion('Error');
      });
  }, []);

  return (
    <>
      <footer className="mt-8 text-center text-xs text-gray-500">
        <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mb-2">
          <a
            href={`https://github.com/thef4tdaddy/chastityOS/releases/tag/${version.replace(/\s.*$/, '')}`}
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
            href="https://ko-fi.com/chastityos"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-300"
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
            <div className="bg-gray-800 border border-purple-600 p-6 rounded-lg max-w-xl w-full overflow-y-auto max-h-[90vh] text-left">
              <PrivacyPage onBack={() => setShowPrivacy(false)} />
            </div>
          </div>
        </Suspense>
      )}

      {showFeedback && (
        <Suspense fallback={<div className="text-white">Loading Feedback Form...</div>}>
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-purple-600 p-6 rounded-lg max-w-xl w-full overflow-y-auto max-h-[90vh] text-left">
              <FeedbackForm onBack={() => setShowFeedback(false)} userId={userId} />
            </div>
          </div>
        </Suspense>
      )}
    </>
  );
};

export default FooterNav;
