// src/components/settings/KeyholderSection.jsx
import React, { useState, useEffect } from 'react';
import { formatElapsedTime } from '../../utils';

const KeyholderSection = ({
  keyholderName,
  handleSetKeyholder,
  handleClearKeyholder,
  handleUnlockKeyholderControls,
  isKeyholderModeUnlocked,
  handleLockKeyholderControls,
  requiredKeyholderDurationSeconds,
  handleSetRequiredDuration,
  handleAddReward,
  handleAddPunishment,
  keyholderMessage,
  isAuthReady
}) => {
  const [khNameInput, setKhNameInput] = useState('');
  const [khPasswordInput, setKhPasswordInput] = useState('');
  const [khRequiredDurationDays, setKhRequiredDurationDays] = useState('');
  const [khRequiredDurationHours, setKhRequiredDurationHours] = useState('');
  const [khRequiredDurationMinutes, setKhRequiredDurationMinutes] = useState('');

  useEffect(() => {
    if (requiredKeyholderDurationSeconds) {
      const days = Math.floor(requiredKeyholderDurationSeconds / 86400);
      const hours = Math.floor((requiredKeyholderDurationSeconds % 86400) / 3600);
      const minutes = Math.floor((requiredKeyholderDurationSeconds % 3600) / 60);
      setKhRequiredDurationDays(days.toString());
      setKhRequiredDurationHours(hours.toString());
      setKhRequiredDurationMinutes(minutes.toString());
    }
  }, [requiredKeyholderDurationSeconds]);

  const onSetKeyholder = async () => {
    if (!khNameInput.trim()) return;
    await handleSetKeyholder(khNameInput);
    setKhNameInput('');
  };

  const onUnlockControls = async () => {
    await handleUnlockKeyholderControls(khPasswordInput);
    setKhPasswordInput('');
  };

  const onSetKHRequiredDuration = async () => {
    const days = parseInt(khRequiredDurationDays) || 0;
    const hours = parseInt(khRequiredDurationHours) || 0;
    const minutes = parseInt(khRequiredDurationMinutes) || 0;
    const totalSeconds = days * 86400 + hours * 3600 + minutes * 60;
    await handleSetRequiredDuration(totalSeconds);
  };

  const [rewardDays, setRewardDays] = useState('');
  const [rewardHours, setRewardHours] = useState('');
  const [rewardMinutes, setRewardMinutes] = useState('');
  const [rewardOther, setRewardOther] = useState('');
  const [punishDays, setPunishDays] = useState('');
  const [punishHours, setPunishHours] = useState('');
  const [punishMinutes, setPunishMinutes] = useState('');
  const [punishOther, setPunishOther] = useState('');

  const onAddReward = async () => {
    const secs = (parseInt(rewardDays)||0)*86400 + (parseInt(rewardHours)||0)*3600 + (parseInt(rewardMinutes)||0)*60;
    await handleAddReward({ timeSeconds: secs, other: rewardOther });
    setRewardDays(''); setRewardHours(''); setRewardMinutes(''); setRewardOther('');
  };

  const onAddPunishment = async () => {
    const secs = (parseInt(punishDays)||0)*86400 + (parseInt(punishHours)||0)*3600 + (parseInt(punishMinutes)||0)*60;
    await handleAddPunishment({ timeSeconds: secs, other: punishOther });
    setPunishDays(''); setPunishHours(''); setPunishMinutes(''); setPunishOther('');
  };

  return (
    <div className="mb-8 p-4 bg-gray-800 border border-pink-700 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold text-pink-300 mb-4">Keyholder Mode</h3>
      {!keyholderName ? (
        <>
          <input type="text" value={khNameInput} onChange={e => setKhNameInput(e.target.value)} placeholder="Keyholder's Name"
            className="w-full px-3 py-2 mb-3 rounded border border-pink-600 bg-gray-900 text-white" />
          <button onClick={onSetKeyholder} disabled={!isAuthReady || !khNameInput.trim()}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded">Set Keyholder</button>
        </>
      ) : (
        <>
          <p className="text-purple-300 mb-2">Keyholder: <strong>{keyholderName}</strong></p>
          {!isKeyholderModeUnlocked ? (
            <>
              <input type="text" maxLength={8} value={khPasswordInput} onChange={e => setKhPasswordInput(e.target.value)} placeholder="Enter Password Preview"
                className="w-full px-3 py-2 mb-3 rounded border border-pink-600 bg-gray-900 text-white" />
              <button onClick={onUnlockControls} className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded">Unlock Controls</button>
            </>
          ) : (
            <div>
              <p className="text-purple-200 mb-2">Required Duration: {requiredKeyholderDurationSeconds ? formatElapsedTime(requiredKeyholderDurationSeconds) : 'Not Set'}</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <input type="number" value={khRequiredDurationDays} onChange={e => setKhRequiredDurationDays(e.target.value)} placeholder="Days"
                  className="px-2 py-1 border border-pink-600 bg-gray-900 text-white rounded" />
                <input type="number" value={khRequiredDurationHours} onChange={e => setKhRequiredDurationHours(e.target.value)} placeholder="Hours"
                  className="px-2 py-1 border border-pink-600 bg-gray-900 text-white rounded" />
                <input type="number" value={khRequiredDurationMinutes} onChange={e => setKhRequiredDurationMinutes(e.target.value)} placeholder="Minutes"
                  className="px-2 py-1 border border-pink-600 bg-gray-900 text-white rounded" />
              </div>
              <button onClick={onSetKHRequiredDuration} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded mr-2">Update Duration</button>
              <button onClick={handleLockKeyholderControls} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded">Lock</button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="text-pink-200 mb-1 font-medium">Add Reward</h4>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    <input type="number" value={rewardDays} onChange={e=>setRewardDays(e.target.value)} placeholder="Days" className="px-2 py-1 border border-green-600 bg-gray-900 text-white rounded" />
                    <input type="number" value={rewardHours} onChange={e=>setRewardHours(e.target.value)} placeholder="Hours" className="px-2 py-1 border border-green-600 bg-gray-900 text-white rounded" />
                    <input type="number" value={rewardMinutes} onChange={e=>setRewardMinutes(e.target.value)} placeholder="Minutes" className="px-2 py-1 border border-green-600 bg-gray-900 text-white rounded" />
                  </div>
                  <input type="text" value={rewardOther} onChange={e=>setRewardOther(e.target.value)} placeholder="Other reward" className="w-full px-2 py-1 border border-green-600 bg-gray-900 text-white rounded mb-2" />
                  <button onClick={onAddReward} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">Add Reward</button>
                </div>
                <div>
                  <h4 className="text-pink-200 mb-1 font-medium">Add Punishment</h4>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    <input type="number" value={punishDays} onChange={e=>setPunishDays(e.target.value)} placeholder="Days" className="px-2 py-1 border border-red-600 bg-gray-900 text-white rounded" />
                    <input type="number" value={punishHours} onChange={e=>setPunishHours(e.target.value)} placeholder="Hours" className="px-2 py-1 border border-red-600 bg-gray-900 text-white rounded" />
                    <input type="number" value={punishMinutes} onChange={e=>setPunishMinutes(e.target.value)} placeholder="Minutes" className="px-2 py-1 border border-red-600 bg-gray-900 text-white rounded" />
                  </div>
                  <input type="text" value={punishOther} onChange={e=>setPunishOther(e.target.value)} placeholder="Other punishment" className="w-full px-2 py-1 border border-red-600 bg-gray-900 text-white rounded mb-2" />
                  <button onClick={onAddPunishment} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">Add Punishment</button>
                </div>
              </div>
            </div>
          )}
          <button onClick={handleClearKeyholder} className="mt-3 bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded text-sm">Clear Keyholder</button>
        </>
      )}
      {keyholderMessage && <p className="text-sm mt-2 text-purple-300">{keyholderMessage}</p>}
    </div>
  );
};

export default KeyholderSection;
