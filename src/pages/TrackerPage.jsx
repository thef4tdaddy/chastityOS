import React from 'react';
import { formatTime, formatElapsedTime } from '../utils'; // Ensure this path is correct

/**
 * TrackerPage component to display chastity tracking information and controls.
 * @param {object} props - The component's props.
 * @param {boolean} props.isCageOn - Current status of the cage.
 * @param {Date|null} props.cageLastOnTime - Timestamp of when the cage was last put on (for current session).
 * @param {number} props.currentSessionInChastitySeconds - Duration of the current chastity session in seconds.
 * @param {number} props.currentSessionCageOffSeconds - Duration since the cage was last taken off.
 * @param {number} props.overallTotalChastitySeconds - Overall total time spent in chastity.
 * @param {number} props.overallTotalCageOffSeconds - Overall total time spent out of chastity.
 * @param {Array} props.chastityHistory - Array of past chastity sessions (currently not directly used in this UI but good to have).
 * @param {function} props.handleToggleCage - Function to toggle the cage status.
 * @param {string|null} props.unlockReasonInput - Current value of the unlock reason input.
 * @param {function} props.setUnlockReasonInput - Function to update the unlock reason input.
 * @param {boolean} props.showUnlockReasonPrompt - Flag to show the unlock reason input field.
 * @param {function} props.setShowUnlockReasonPrompt - Function to toggle the unlock reason input field.
 * @returns {JSX.Element} The rendered TrackerPage component.
 */
const TrackerPage = ({
  isCageOn,
  cageLastOnTime,
  currentSessionInChastitySeconds,
  currentSessionCageOffSeconds,
  overallTotalChastitySeconds,
  overallTotalCageOffSeconds,
  // chastityHistory, // Not directly displayed in this specific UI but available
  handleToggleCage,
  unlockReasonInput,
  setUnlockReasonInput,
  showUnlockReasonPrompt,
  setShowUnlockReasonPrompt
}) => {

  const handlePrimaryButtonClick = () => {
    if (isCageOn) {
      setShowUnlockReasonPrompt(true); // Show prompt before unlocking
    } else {
      handleToggleCage(""); // Lock immediately, no reason needed
      setShowUnlockReasonPrompt(false); // Ensure prompt is hidden
    }
  };

  const handleConfirmUnlock = () => {
    if (unlockReasonInput.trim() === "") {
      // Optionally, show an error message that reason is required
      alert("Please provide a reason for unlocking."); // Replace with a modal in production
      return;
    }
    handleToggleCage(unlockReasonInput);
    setShowUnlockReasonPrompt(false);
    setUnlockReasonInput(""); // Clear input after submission
  };

  const handleCancelUnlock = () => {
    setShowUnlockReasonPrompt(false);
    setUnlockReasonInput("");
  };

  // Determine button text and style based on cage status
  const buttonText = isCageOn ? "Cage Off / End Session" : "Cage On / Start Session";
  const buttonClass = isCageOn 
    ? "bg-red-600 hover:bg-red-700" 
    : "bg-green-600 hover:bg-green-700";

  const StatBox = ({ title, value, valueClass = "text-3xl" }) => (
    <div className="bg-gray-700 p-4 rounded-lg shadow-md text-center">
      <h3 className="text-sm font-semibold text-purple-300 mb-1">{title}</h3>
      <p className={`font-mono text-purple-100 ${valueClass}`}>{value}</p>
    </div>
  );

  return (
    <div className="p-4 text-purple-200">
      <h2 className="text-2xl font-bold mb-6 text-center">Chastity Tracker</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatBox 
          title="Cage Last On" 
          value={isCageOn && cageLastOnTime ? formatTime(cageLastOnTime, true) : 'N/A'} 
          valueClass={isCageOn && cageLastOnTime ? "text-xl md:text-2xl" : "text-3xl"}
        />
        <StatBox 
          title="Current Session In Chastity" 
          value={isCageOn ? formatElapsedTime(currentSessionInChastitySeconds) : '00:00:00'} 
        />
        <StatBox 
          title="Current Session Cage Off" 
          value={!isCageOn ? formatElapsedTime(currentSessionCageOffSeconds) : '00:00:00'} 
        />
        <StatBox 
          title="Total Time In Chastity" 
          value={formatElapsedTime(overallTotalChastitySeconds)} 
        />
        <StatBox 
          title="Total Time Cage Off" 
          value={formatElapsedTime(overallTotalCageOffSeconds)} 
        />
         <div className="md:col-span-2 text-center text-sm text-purple-400">
            Cage Status: <span className={`font-semibold ${isCageOn ? 'text-green-400' : 'text-red-400'}`}>{isCageOn ? 'Locked' : 'Unlocked'}</span>
        </div>
      </div>

      {showUnlockReasonPrompt && isCageOn && (
        <div className="mb-4 p-4 bg-gray-750 rounded-lg border border-purple-600">
          <label htmlFor="unlockReason" className="block text-sm font-medium text-purple-300 mb-1">
            Reason for Unlocking:
          </label>
          <input
            type="text"
            id="unlockReason"
            value={unlockReasonInput}
            onChange={(e) => setUnlockReasonInput(e.target.value)}
            placeholder="E.g., Hygiene, Playtime, End of Lockup"
            className="w-full px-3 py-2 rounded-md border border-purple-500 bg-gray-800 text-gray-50 focus:ring-purple-500 focus:border-purple-500"
          />
          <div className="mt-3 flex justify-end space-x-3">
            <button
              onClick={handleCancelUnlock}
              className="px-4 py-2 rounded-md text-sm bg-gray-600 hover:bg-gray-500 text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmUnlock}
              className="px-4 py-2 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Confirm Unlock
            </button>
          </div>
        </div>
      )}

      {!showUnlockReasonPrompt && (
        <button
          onClick={handlePrimaryButtonClick}
          className={`w-full py-3 px-4 rounded-lg text-white font-semibold shadow-md transition-colors ${buttonClass}`}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default TrackerPage;
