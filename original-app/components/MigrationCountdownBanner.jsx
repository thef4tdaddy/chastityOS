import { useEffect, useState } from "react";

const targetTime = new Date("2025-06-13T08:00:00-05:00"); // CDT

export default function MigrationCountdownBanner() {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft.total <= 0 || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-black text-center p-3 shadow-md">
      <div className="flex items-center justify-center gap-4 flex-wrap text-sm sm:text-base">
        <div>
          <strong>⚠️ Migration Warning:</strong> ChastityOS will switch to a new
          database at <strong>8:00 AM CDT</strong>.
          <span className="ml-2">
            Export your data now. Time left:{" "}
            <strong>{formatTime(timeLeft)}</strong>
          </span>
          <a
            href="/export"
            className="ml-4 underline font-semibold text-blue-700 hover:text-blue-900"
          >
            Export My Data
          </a>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 px-3 py-1 text-xs sm:text-sm bg-black text-yellow-400 rounded hover:bg-gray-800"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function getTimeRemaining() {
  const total = targetTime - new Date();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { total, days, hours, minutes, seconds };
}

function formatTime({ days, hours, minutes, seconds }) {
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
