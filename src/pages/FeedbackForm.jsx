import React, { useState } from 'react';

const FeedbackForm = ({ onBack, userId }) => {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setStatus({ type: 'error', message: 'Please enter your feedback before submitting.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'info', message: 'Submitting feedback...' });

    // Simulate an API call or integrate with a real feedback service here
    // For now, we'll use Google Analytics event and a timeout
    console.log("Feedback submitted:", { userId, feedback });
    
    // GA Event
    if (window.gtag) {
        window.gtag('event', 'feedback_submission', {
            'event_category': 'User Interaction',
            'event_label': 'Beta Feedback Submitted',
            'user_id': userId, // Optional: if you want to associate feedback with a user ID in GA
            'feedback_length': feedback.length
        });
    }


    // Simulate network delay
    setTimeout(() => {
      setStatus({ type: 'success', message: 'Thank you for your feedback! It has been noted.' });
      setFeedback('');
      setIsSubmitting(false);
      // Optionally, automatically go back after a delay
      // setTimeout(onBack, 2000); 
    }, 1000);
  };

  return (
    <div className="p-2 sm:p-4 text-left text-purple-200">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-purple-300">Submit Beta Feedback</h2>
      <p className="text-sm text-gray-400 mb-4">
        Your input is valuable for improving ChastityOS. Please share any thoughts, suggestions, or issues you've encountered.
      </p>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
          rows="6"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Type your feedback here..."
          disabled={isSubmitting}
        ></textarea>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <button 
            type="submit" 
            className="w-full sm:w-auto px-6 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors disabled:opacity-50"
            disabled={isSubmitting || !feedback.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
          <button 
            type="button" 
            onClick={onBack} 
            className="w-full sm:w-auto mt-3 sm:mt-0 px-6 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
      {status && (
        <p className={`mt-4 text-sm ${
          status.type === 'success' ? 'text-green-400' : 
          status.type === 'error' ? 'text-red-400' : 
          'text-blue-400'
        }`}>
          {status.message}
        </p>
      )}
    </div>
  );
};

export default FeedbackForm;