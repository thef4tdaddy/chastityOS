
import React from 'react';

const PrivacyPage = ({ onBack }) => {
  return (
    <div className="p-6 text-left text-purple-200">
      <h2 className="text-xl font-bold mb-4">Privacy & Analytics</h2>
      <p className="mb-4">
        ChastityOS uses Google Analytics and Google Tag Manager to help us understand how users interact with the app during beta.
        We also use Hotjar for anonymous heatmaps and click tracking. No personal or identifying data is shared with third parties.
      </p>
      <p className="mb-4">
        By participating in the beta, you agree to this anonymous tracking. When we move to public release, we will offer opt-out controls.
      </p>
      <button onClick={onBack} className="mt-4 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white">
        Back to Settings
      </button>
    </div>
  );
};

export default PrivacyPage;
