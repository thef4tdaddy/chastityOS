
import React, { useState } from 'react';

const FeedbackForm = ({ onBack, userId }) => {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setStatus('Please enter your feedback.');
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'feedback_submitted',
      user_id: userId
    });

    setStatus('Thank you for your feedback!');
    setFeedback('');
  };

  return (
    <div className="p-6 text-left text-purple-200">
      <h2 className="text-xl font-bold mb-4">Submit Beta Feedback</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-2 rounded bg-gray-700 text-white"
          rows="5"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Your feedback here..."
        ></textarea>
        <button type="submit" className="mt-4 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white">
          Submit
        </button>
      </form>
      {status && <p className="mt-2 text-sm text-green-400">{status}</p>}
      <button onClick={onBack} className="mt-4 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white">
        Back to Settings
      </button>
    </div>
  );
};

export default FeedbackForm;
