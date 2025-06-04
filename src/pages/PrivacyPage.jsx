import React from 'react';

const PrivacyPage = ({ onBack }) => {
  return (
    <div className="p-2 sm:p-4 text-left text-purple-200">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-purple-300">Privacy & Analytics</h2>
      <div className="space-y-4 text-sm sm:text-base text-gray-300">
        <p>
          ChastityOS uses Google Analytics and Google Tag Manager to help us understand how users interact with the app during beta.
          This helps us identify popular features, areas for improvement, and potential bugs.
        </p>
        <p>
          We also use Hotjar for anonymous heatmaps and click tracking. This allows us to see how users navigate pages and where they might be encountering difficulties, without recording any personal data or specific inputs.
        </p>
        <p>
          <strong>No personal or identifying data (such as your Submissive's Name, event notes, or specific chastity timings) is shared with these third-party analytics services.</strong> All tracking is done in an aggregated and anonymized manner to respect your privacy while helping us improve the application. Your User ID, if sent, is for anonymized analytics aggregation only.
        </p>
        <p>
          By participating in the beta, you agree to this anonymous tracking. When we move to a public release, we will offer more granular opt-out controls.
        </p>
        <p>
          Your chastity data and event logs are stored securely in your personal Firebase account and are not accessed by us unless you explicitly share your User ID for support purposes.
        </p>
      </div>
      <button 
        type="button"
        onClick={onBack} 
        className="mt-6 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
      >
        Back
      </button>
    </div>
  );
};

export default PrivacyPage;