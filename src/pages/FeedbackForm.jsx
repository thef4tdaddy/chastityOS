import React, { useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const FeedbackForm = () => {
  const [type, setType] = useState('bug');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [discordError, setDiscordError] = useState('');

  const discordWebhook = {
    bug: import.meta.env.VITE_DISCORD_WEBHOOK_BUG,
    suggestion: import.meta.env.VITE_DISCORD_WEBHOOK_SUGGESTION
  };

  const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
  const githubRepo = import.meta.env.VITE_GITHUB_REPO;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!discordUsername.trim()) {
      setDiscordError('Discord username is required.');
      setStatus('Form not submitted: Discord username missing.');
      return;
    }

    setSubmitting(true);
    setStatus('');
    setDiscordError('');

    // Define app version with environment label
    const appVersion = `${import.meta.env.VITE_APP_VERSION || 'dev'} (${import.meta.env.VITE_ENV || 'local'})`;
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const timestamp = dayjs().tz('America/Chicago').format('YYYY-MM-DD hh:mm A z');

    const label = type === 'bug' ? ['bug'] : ['enhancement'];
    const discordPayload = {
      content: `**New ${type.toUpperCase()}**\n${message}\n\n**User:** ${discordUsername}\n**App Version:** ${appVersion}\n**Time:** ${timestamp}\n**Platform:** ${platform}\n**User Agent:** ${userAgent}`
    };
    const githubPayload = {
      title: `[${type.toUpperCase()}] ${appVersion}: ${message.substring(0, 60)}`,
      body: `${message}\n\n🔖 **App Version:** ${appVersion}\n🕒 **Time:** ${timestamp}\n💻 **Platform:** ${platform}\n🧭 **User Agent:** ${userAgent}`,
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
    <form onSubmit={handleSubmit} className="p-4 border rounded-md text-left space-y-4 bg-theme-bg border-theme-border text-theme-text">
      <div className="text-theme-accent font-semibold">Submit Feedback</div>
      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-theme-input border border-theme-border text-theme-text px-3 py-2 rounded-md">
        <option value="bug">Bug</option>
        <option value="suggestion">Suggestion</option>
      </select>
      <input
        type="text"
        value={discordUsername}
        onChange={(e) => {
          setDiscordUsername(e.target.value);
          if (discordError) setDiscordError('');
        }}
        placeholder="Your Discord Username"
        required
        className="w-full bg-theme-input border border-theme-border text-theme-text px-3 py-2 rounded-md"
      />
      {discordError && <p className="text-red-400 text-sm">{discordError}</p>}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe the bug or suggestion..."
        required
        rows={4}
        className="w-full bg-theme-input border border-theme-border text-theme-text px-3 py-2 rounded-md"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-theme-button hover:bg-theme-button-hover text-white py-2 rounded-md"
      >
        {submitting ? 'Sending...' : 'Submit'}
      </button>
      {status && <p className={`text-sm ${status.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{status}</p>}
    </form>
  );
};

export default FeedbackForm;
