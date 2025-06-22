import React, { useState, useEffect } from 'react';
import { formatElapsedTime } from '../../utils';

const KeyholderSection = ({
  keyholderName,
  handleSetKeyholderName,
  handleKeyholderPasswordCheck,
  handleSetPermanentPassword,
  isKeyholderModeUnlocked,
  handleLockKeyholderControls,
  requiredKeyholderDurationSeconds,
  handleSetRequiredDuration,
  handleAddReward,
  handleAddPunishment,
  handleAddTask, // <-- Added prop to handle adding tasks
  keyholderMessage,
  isAuthReady
}) => {
  const [khNameInput, setKhNameInput] = useState('');
  const [khPasswordInput, setKhPasswordInput] = useState('');
  const [khRequiredDurationDays, setKhRequiredDurationDays] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [modalPassword, setModalPassword] = useState('');

  // --- State for the new task input ---
  const [taskInput, setTaskInput] = useState('');

  // Effect to sync the duration input field with the main state.
  useEffect(() => {
    if (requiredKeyholderDurationSeconds) {
      const days = Math.floor(requiredKeyholderDurationSeconds / 86400);
      setKhRequiredDurationDays(days.toString());
    } else {
      setKhRequiredDurationDays('');
    }
  }, [requiredKeyholderDurationSeconds]);
  
  // Effect to show the password modal.
  useEffect(() => {
    if (keyholderMessage && keyholderMessage.includes('password is:')) {
      const password = keyholderMessage.split(':')[1].split('.')[0].trim();
      setModalPassword(password);
      setIsPasswordModalVisible(true);
    }
  }, [keyholderMessage]);

  const onSetKeyholder = () => {
    if (!khNameInput.trim()) return;
    handleSetKeyholderName(khNameInput);
  };

  const onUnlockControls = () => {
    handleKeyholderPasswordCheck(khPasswordInput);
    setKhPasswordInput('');
  };

  const onSetPermanentPassword = () => {
    if (newPassword !== confirmNewPassword) {
      alert("Passwords do not match."); // Note: A custom modal would be better than alert().
      return;
    }
    handleSetPermanentPassword(newPassword);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const onSetKHRequiredDurationAndLock = async () => {
    const days = parseInt(khRequiredDurationDays, 10) || 0;
    const totalSeconds = days * 86400;
    await handleSetRequiredDuration(totalSeconds);
    handleLockKeyholderControls();
  };
  
  const [rewardDays, setRewardDays] = useState('');
  const [rewardOther, setRewardOther] = useState('');
  const [punishDays, setPunishDays] = useState('');
  const [punishOther, setPunishOther] = useState('');

  const onAddReward = async () => {
    const secs = (parseInt(rewardDays, 10)||0) * 86400;
    await handleAddReward({ timeSeconds: secs, other: rewardOther });
    setRewardDays(''); setRewardOther('');
  };

  const onAddPunishment = async () => {
    const secs = (parseInt(punishDays, 10)||0) * 86400;
    await handleAddPunishment({ timeSeconds: secs, other: punishOther });
    setPunishDays(''); setPunishOther('');
  };

  // --- Handler to call the handleAddTask prop ---
  const onAddTask = async () => {
    if (taskInput.trim() && handleAddTask) {
      await handleAddTask(taskInput);
      setTaskInput(''); // Clear the input after adding
    }
  };

  return (
    <>
      <div className="mb-8 p-4 bg-gray-900/50 border-2 border-keyholder rounded-2xl shadow-lg shadow-red-500/20">
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
                <p className="text-sm my-2 text-keyholder">Enter the keyholder password to unlock controls.</p>
                <input type="password" value={khPasswordInput} onChange={e => setKhPasswordInput(e.target.value)} placeholder="Enter Password"
                  className="inputbox-red !text-red-300" />
                <button onClick={onUnlockControls} className="button-red !text-red-300">Unlock Controls</button>
              </>
            ) : (
              <div>
                <div className="alert alert-success mb-4"><p>Controls Unlocked</p></div>
                
                <div className="my-6 p-4 border border-green-500 rounded-lg">
                  <h4 className="title-green !text-green-300 mb-2">Set Permanent Password</h4>
                  <p className="text-xs text-gray-400 mb-3">Optionally, set a custom password. If you don't, the randomly generated one will remain the permanent password.</p>
                  <div className="space-y-2">
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Permanent Password"
                      className="inputbox-green w-full" />
                    <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Confirm New Password"
                      className="inputbox-green w-full" />
                  </div>
                  <button onClick={onSetPermanentPassword} className="button-green !text-green-300 mt-2">Set Custom Password</button>
                  {keyholderMessage.includes("updated successfully") && <p className="text-green-400 text-sm mt-2">{keyholderMessage}</p>}
                </div>

                <hr className="my-4 border-purple-700"/>

                {/* --- Assign Task Section --- */}
                <div className="my-6 p-4 border border-blue-500 rounded-lg">
                  <h4 className="title-blue !text-blue-300 mb-2">Assign a New Task</h4>
                  <p className="text-xs text-gray-400 mb-3">Assign a task that the user must complete and submit for review.</p>
                  <input
                    type="text"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="Enter a new task description"
                    className="inputbox-blue !text-blue-300 w-full mb-2 bg-transparent"
                  />
                  <button onClick={onAddTask} className="button-blue !text-blue-300 mt-2">
                    Assign Task
                  </button>
                </div>
                {/* --- End Assign Task Section --- */}

                <hr className="my-4 border-purple-700"/>

                <p className="text-blue mb-2">Required Duration: {requiredKeyholderDurationSeconds ? formatElapsedTime(requiredKeyholderDurationSeconds) : 'Not Set'}</p>
                 <div className="grid grid-cols-1 gap-2 mb-3">
                  <input type="number" value={khRequiredDurationDays} onChange={e => setKhRequiredDurationDays(e.target.value)} placeholder="Set Duration in Days"
                    className="inputbox-blue !text-blue-300 bg-transparent" />
                </div>
                <button onClick={onSetKHRequiredDurationAndLock} className="button-blue !text-blue-300">Update & Lock</button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="title-yellow !text-yellow-300">Reward</h4>
                    <div className="grid grid-cols-1 gap-1 mb-2">
                      <input type="number" value={rewardDays} onChange={e=>setRewardDays(e.target.value)} placeholder="Subtract Days" className="inputbox-yellow !text-yellow-300 bg-transparent" />
                    </div>
                    <input type="text" value={rewardOther} onChange={e=>setRewardOther(e.target.value)} placeholder="Note (optional)"
                      className="inputbox-yellow !text-yellow-300 w-full mb-2 bg-transparent" />
                    <p className="text-xs text-gray-400 italic text-left mt-1">
                      Describe the reward (e.g., a special treat, early release). This can be used with or without a time adjustment.
                    </p>
                    <button onClick={onAddReward} className="button-yellow !text-yellow-300 mt-2">Add Reward</button>
                  </div>
                  <div>
                    <h4 className="title-red !text-red-300">Punishment</h4>
                    <div className="grid grid-cols-1 gap-1 mb-2">
                      <input type="number" value={punishDays} onChange={e=>setPunishDays(e.target.value)} placeholder="Add Days" className="inputbox-red !text-red-300 bg-transparent" />
                    </div>
                    <input type="text" value={punishOther} onChange={e=>setPunishOther(e.target.value)} placeholder="Note (optional)"
                      className="inputbox-red !text-red-300 w-full mb-2 bg-transparent" />
                     <p className="text-xs text-gray-400 italic text-left mt-1">
                      Describe the punishment (e.g., extra chores, writing lines). This can be used with or without a time adjustment.
                    </p>
                    <button onClick={onAddPunishment} className="button-red !text-red-300 mt-2">Add Punishment</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isPasswordModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border-2 border-yellow-500 rounded-lg shadow-2xl p-6 w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4">Your Keyholder Password</h2>
            <p className="text-gray-300 mb-4">
              Your keyholder must use this password to unlock the controls.
            </p>
            <div className="bg-gray-900 p-4 rounded-lg my-4 border border-gray-600">
              <p className="text-3xl font-mono tracking-widest text-white select-all">{modalPassword}</p>
            </div>
            <p className="text-sm text-yellow-400 mb-6">
              This is the permanent password unless a new custom password is set.
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
