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
    <div className="mb-8 p-4 bg-transparent border border-keyholder rounded-lg shadow-sm">
      <h3 className="title-red !text-red-300">Keyholder Mode</h3>
      {!keyholderName ? (
        <>
          <input type="text" value={khNameInput} onChange={e => setKhNameInput(e.target.value)} placeholder="Keyholder's Name"
            className="inputbox-red !text-red-300" />
          <button onClick={onSetKeyholder} disabled={!isAuthReady || !khNameInput.trim()}
            className="button-red !text-red-300">Set Keyholder</button>
        </>
      ) : (
        <>
          <p className="text-keyholder mb-2">Keyholder: <strong>{keyholderName}</strong></p>
          {!isKeyholderModeUnlocked ? (
            <>
              <input type="text" maxLength={8} value={khPasswordInput} onChange={e => setKhPasswordInput(e.target.value)} placeholder="Enter Password Preview"
                className="inputbox-red !text-red-300" />
              <button onClick={onUnlockControls} className="button-red !text-red-300">Unlock Controls</button>
            </>
          ) : (
            <div>
              <p className="text-blue mb-2">Required Duration: {requiredKeyholderDurationSeconds ? formatElapsedTime(requiredKeyholderDurationSeconds) : 'Not Set'}</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <input type="number" value={khRequiredDurationDays} onChange={e => setKhRequiredDurationDays(e.target.value)} placeholder="Days"
                  className="inputbox-blue !text-blue-300 bg-transparent" />
                <input type="number" value={khRequiredDurationHours} onChange={e => setKhRequiredDurationHours(e.target.value)} placeholder="Hours"
                  className="inputbox-blue !text-blue-300 bg-transparent" />
                <input type="number" value={khRequiredDurationMinutes} onChange={e => setKhRequiredDurationMinutes(e.target.value)} placeholder="Minutes"
                  className="inputbox-blue !text-blue-300 bg-transparent" />
              </div>
              <button onClick={onSetKHRequiredDuration} className="button-blue !text-blue-300 mr-2">Update Duration</button>
              <button onClick={handleLockKeyholderControls} className="button-blue !text-blue-300">Lock</button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="title-yellow !text-yellow-300">Add Reward</h4>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    <input type="number" value={rewardDays} onChange={e=>setRewardDays(e.target.value)} placeholder="Days" className="inputbox-yellow !text-yellow-300 bg-transparent" />
                    <input type="number" value={rewardHours} onChange={e=>setRewardHours(e.target.value)} placeholder="Hours" className="inputbox-yellow !text-yellow-300 bg-transparent" />
                    <input type="number" value={rewardMinutes} onChange={e=>setRewardMinutes(e.target.value)} placeholder="Minutes" className="inputbox-yellow !text-yellow-300 bg-transparent" />
                  </div>
                  <input type="text" value={rewardOther} onChange={e=>setRewardOther(e.target.value)} placeholder="Other reward" className="inputbox-yellow !text-yellow-300 w-full mb-2 bg-transparent" />
                  <button onClick={onAddReward} className="button-yellow !text-yellow-300">Add Reward</button>
                </div>
                <div>
                  <h4 className="title-red !text-red-300">Add Punishment</h4>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    <input type="number" value={punishDays} onChange={e=>setPunishDays(e.target.value)} placeholder="Days" className="inputbox-red !text-red-300 bg-transparent" />
                    <input type="number" value={punishHours} onChange={e=>setPunishHours(e.target.value)} placeholder="Hours" className="inputbox-red !text-red-300 bg-transparent" />
                    <input type="number" value={punishMinutes} onChange={e=>setPunishMinutes(e.target.value)} placeholder="Minutes" className="inputbox-red !text-red-300 bg-transparent" />
                  </div>
                  <input type="text" value={punishOther} onChange={e=>setPunishOther(e.target.value)} placeholder="Other punishment" className="inputbox-red !text-red-300 w-full mb-2 bg-transparent" />
                  <button onClick={onAddPunishment} className="button-red !text-red-300">Add Punishment</button>
                </div>
              </div>
            </div>
          )}
          <button onClick={handleClearKeyholder} className="button-red !text-red-300 mt-3">Clear Keyholder</button>
        </>
      )}
      {keyholderMessage && <p className="text-sm mt-2 text-keyholder">{keyholderMessage}</p>}
    </div>
  );
};

export default KeyholderSection;
