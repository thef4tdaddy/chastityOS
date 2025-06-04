import React, { useState } from 'react';
import axios from 'axios';

const FeedbackForm = () => {
  const [type, setType] = useState('bug');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  const discordWebhook = {
    bug: import.meta.env.VITE_DISCORD_WEBHOOK_BUG,
    suggestion: import.meta.env.VITE_DISCORD_WEBHOOK_SUGGESTION
  };

  const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
  const githubRepo = import.meta.env.VITE_GITHUB_REPO;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus('');

    const label = type === 'bug' ? ['bug'] : ['enhancement'];
    const title = `${type === 'bug' ? 'Bug Report' : 'Feature Suggestion'}: ${message.substring(0, 60)}`;
    const discordPayload = { content: `**New ${type.toUpperCase()}**\n${message}` };
    const githubPayload = {
      title,
      body: message,
      labels: label
    };

    // Debug: Print what we're using
    console.log('🚀 Submitting feedback...');
    console.log('📦 Type:', type);
    console.log('📝 Message:', message);
    console.log('🌐 GitHub Repo:', githubRepo);
    console.log('🔑 GitHub Token prefix:', githubToken?.slice(0, 6));
    console.log('📄 GitHub Payload:', githubPayload);

    try {
      // Discord submission
      await axios.post(discordWebhook[type], discordPayload);
      console.log('✅ Discord post successful');

      // GitHub issue creation
      if (!githubRepo || !githubToken) {
        console.warn('⚠️ GitHub environment variables are missing. Skipping GitHub issue creation.');
      } else {
        const response = await axios.post(
          `https://api.github.com/repos/${githubRepo}/issues`,
          githubPayload,
          {
            headers: {
              Authorization: `token ${githubToken}`,
              Accept: 'application/vnd.github.v3+json'
            }
          }
        );
        console.log('✅ GitHub issue created:', response.data.html_url);
      }

      setStatus('Feedback sent successfully!');
      setMessage('');
    } catch (err) {
      console.error('❌ Error submitting feedback:', err.response?.data || err.message);
      setStatus('Error submitting feedback. See console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800 border border-purple-700 rounded-md text-left space-y-4">
      <div className="text-purple-200 font-semibold">Submit Feedback</div>
      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-700 border border-purple-600 text-purple-100 px-3 py-2 rounded-md">
        <option value="bug">Bug</option>
        <option value="suggestion">Suggestion</option>
      </select>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe the bug or suggestion..."
        required
        rows={4}
        className="w-full bg-gray-900 border border-purple-600 text-purple-100 px-3 py-2 rounded-md"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md"
      >
        {submitting ? 'Sending...' : 'Submit'}
      </button>
      {status && <p className={`text-sm ${status.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{status}</p>}
    </form>
  );
};

export default FeedbackForm;
