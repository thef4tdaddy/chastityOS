import React, { useState, useEffect } from 'react';
import { formatElapsedTime } from '../../utils';

const KeyholderSection = ({
  keyholderName,
  handleSetKeyholderName,
  handleKeyholderPasswordCheck,
  isKeyholderModeUnlocked,
  handleLockKeyholderControls,
  requiredKeyholderDurationSeconds,
  handleSetRequiredDuration,
  handleAddReward,
  handleAddPunishment,
  keyholderMessage,
  isAuthReady
}) => {
  // State for the input fields within this component
  const [khNameInput, setKhNameInput] = useState('');
  const [khPasswordInput, setKhPasswordInput] = useState('');
  const [khRequiredDurationDays, setKhRequiredDurationDays] = useState('');
  const [khRequiredDurationHours, setKhRequiredDurationHours] = useState('');
  const [khRequiredDurationMinutes, setKhRequiredDurationMinutes] = useState('');
  
  // State for controlling the password modal
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [modalPassword, setModalPassword] = useState('');

  // Effect to keep duration input fields in sync with the main state
  useEffect(() => {
    if (requiredKeyholderDurationSeconds) {
      const days = Math.floor(requiredKeyholderDurationSeconds / 86400);
      const hours = Math.floor((requiredKeyholderDurationSeconds % 86400) / 3600);
      const minutes = Math.floor((requiredKeyholderDurationSeconds % 3600) / 60);
      setKhRequiredDurationDays(days.toString());
      setKhRequiredDurationHours(hours.toString());
      setKhRequiredDurationMinutes(minutes.toString());
    } else {
      setKhRequiredDurationDays('');
      setKhRequiredDurationHours('');
      setKhRequiredDurationMinutes('');
    }
  }, [requiredKeyholderDurationSeconds]);

  // Effect to watch the keyholderMessage prop and trigger the modal
  useEffect(() => {
    if (keyholderMessage && keyholderMessage.includes('password is:')) {
      const password = keyholderMessage.split(':')[1].split('.')[0].trim();
      setModalPassword(password);
      setIsPasswordModalVisible(true);
    }
  }, [keyholderMessage]);

  // Click handlers that call the functions passed in through props
  const onSetKeyholder = () => {
    if (!khNameInput.trim() || !handleSetKeyholderName) return;
    handleSetKeyholderName(khNameInput);
  };

  const onUnlockControls = () => {
    if (!handleKeyholderPasswordCheck) return;
    handleKeyholderPasswordCheck(khPasswordInput);
    setKhPasswordInput('');
  };

  const onSetKHRequiredDuration = async () => {
    const days = parseInt(khRequiredDurationDays, 10) || 0;
    const hours = parseInt(khRequiredDurationHours, 10) || 0;
    const minutes = parseInt(khRequiredDurationMinutes, 10) || 0;
    const totalSeconds = days * 86400 + hours * 3600 + minutes * 60;
    await handleSetRequiredDuration(totalSeconds);
  };
  
  // Local state for the reward/punishment forms
  const [rewardDays, setRewardDays] = useState('');
  const [rewardHours, setRewardHours] = useState('');
  const [rewardMinutes, setRewardMinutes] = useState('');
  const [rewardOther, setRewardOther] = useState('');
  const [punishDays, setPunishDays] = useState('');
  const [punishHours, setPunishHours] = useState('');
  const [punishMinutes, setPunishMinutes] = useState('');
  const [punishOther, setPunishOther] = useState('');

  const onAddReward = async () => {
    const secs = (parseInt(rewardDays, 10)||0)*86400 + (parseInt(rewardHours, 10)||0)*3600 + (parseInt(rewardMinutes, 10)||0)*60;
    await handleAddReward({ timeSeconds: secs, other: rewardOther });
    setRewardDays(''); setRewardHours(''); setRewardMinutes(''); setRewardOther('');
  };

  const onAddPunishment = async () => {
    const secs = (parseInt(punishDays, 10)||0)*86400 + (parseInt(punishHours, 10)||0)*3600 + (parseInt(punishMinutes, 10)||0)*60;
    await handleAddPunishment({ timeSeconds: secs, other: punishOther });
    setPunishDays(''); setPunishHours(''); setPunishMinutes(''); setPunishOther('');
  };

  return (
    <>
      <div className="mb-8 p-4 bg-transparent border border-keyholder rounded-lg shadow-sm">
        <h3 className="title-red !text-red-300">Keyholder Mode</h3>
        
        {/* If no keyholder is set, show the input to set one */}
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
            
            {/* If a keyholder is set but controls are locked */}
            {!isKeyholderModeUnlocked ? (
              <>
                <p className="text-sm my-2 text-keyholder">Enter the generated password below to unlock controls.</p>
                <input type="password" maxLength={8} value={khPasswordInput} onChange={e => setKhPasswordInput(e.target.value)} placeholder="Enter Password"
                  className="inputbox-red !text-red-300" />
                <button onClick={onUnlockControls} className="button-red !text-red-300">Unlock Controls</button>
              </>
            ) : (
              // If controls are unlocked
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
                    <h4 className="title-yellow !text-yellow-300">Reward (Subtracts Time)</h4>
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      <input type="number" value={rewardDays} onChange={e=>setRewardDays(e.target.value)} placeholder="Days" className="inputbox-yellow !text-yellow-300 bg-transparent" />
                      <input type="number" value={rewardHours} onChange={e=>setRewardHours(e.target.value)} placeholder="Hours" className="inputbox-yellow !text-yellow-300 bg-transparent" />
                      <input type="number" value={rewardMinutes} onChange={e=>setRewardMinutes(e.target.value)} placeholder="Minutes" className="inputbox-yellow !text-yellow-300 bg-transparent" />
                    </div>
                    <input type="text" value={rewardOther} onChange={e=>setRewardOther(e.target.value)} placeholder="Reason for reward" className="inputbox-yellow !text-yellow-300 w-full mb-2 bg-transparent" />
                    <button onClick={onAddReward} className="button-yellow !text-yellow-300">Add Reward</button>
                  </div>
                  <div>
                    <h4 className="title-red !text-red-300">Punishment (Adds Time)</h4>
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      <input type="number" value={punishDays} onChange={e=>setPunishDays(e.target.value)} placeholder="Days" className="inputbox-red !text-red-300 bg-transparent" />
                      <input type="number" value={punishHours} onChange={e=>setPunishHours(e.target.value)} placeholder="Hours" className="inputbox-red !text-red-300 bg-transparent" />
                      <input type="number" value={punishMinutes} onChange={e=>setPunishMinutes(e.target.value)} placeholder="Minutes" className="inputbox-red !text-red-300 bg-transparent" />
                    </div>
                    <input type="text" value={punishOther} onChange={e=>setPunishOther(e.target.value)} placeholder="Reason for punishment" className="inputbox-red !text-red-300 w-full mb-2 bg-transparent" />
                    <button onClick={onAddPunishment} className="button-red !text-red-300">Add Punishment</button>
                  </div>
                </div>
              </div>
            )}
            {/* The "Clear Keyholder" button is no longer an option */}
          </>
        )}
      </div>

      {/* The Password Modal */}
      {isPasswordModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border-2 border-yellow-500 rounded-lg shadow-2xl p-6 w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4">Your One-Time Password</h2>
            <p className="text-gray-300 mb-4">
              Please save the following password. This is the **only** time it will be displayed.
            </p>
            <div className="bg-gray-900 p-4 rounded-lg my-4 border border-gray-600">
              <p className="text-3xl font-mono tracking-widest text-white select-all">{modalPassword}</p>
            </div>
            <p className="text-sm text-yellow-400 mb-6">
              If you lose this password, you will have to reset all your data to set a new keyholder.
            </p>
            <button
              onClick={() => setIsPasswordModalVisible(false)}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300"
            >
              I have saved this password
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyholderSection;
