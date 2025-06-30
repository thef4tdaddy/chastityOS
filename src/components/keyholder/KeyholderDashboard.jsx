import React, { useState, useEffect } from 'react';
import { formatElapsedTime } from '../../utils';
import TaskApprovalSection from './TaskApprovalSection';
import KeyholderAddTaskForm from './KeyholderAddTaskForm';

// This component now uses the specific handlers passed down as props.
const KeyholderDashboard = ({
  keyholderName,
  handleSetKeyholderName,
  handleKeyholderPasswordCheck,
  handleSetPermanentPassword,
  isKeyholderModeUnlocked,
  handleLockKeyholderControls,
  requiredKeyholderDurationSeconds,
  tasks = [],
  keyholderMessage,
  onManageRules,
  isAuthReady,
  // Destructuring all the specific handlers from props
  handleSetRequiredDuration,
  handleAddReward,
  handleAddPunishment,
  handleAddTask,
  handleApproveTask,
  handleRejectTask
}) => {
  const [khNameInput, setKhNameInput] = useState('');
  const [khPasswordInput, setKhPasswordInput] = useState('');
  const [khRequiredDurationDays, setKhRequiredDurationDays] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [modalPassword, setModalPassword] = useState('');

  useEffect(() => {
    if (requiredKeyholderDurationSeconds) {
      const days = Math.floor(requiredKeyholderDurationSeconds / 86400);
      setKhRequiredDurationDays(days.toString());
    } else {
      setKhRequiredDurationDays('');
    }
  }, [requiredKeyholderDurationSeconds]);
  
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
      alert("Passwords do not match.");
      return;
    }
    handleSetPermanentPassword(newPassword);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const onSetKHRequiredDurationAndLock = async () => {
    const days = parseInt(khRequiredDurationDays, 10) || 0;
    const totalSeconds = days * 86400;
    // THE FIX: Calling the specific handler from props
    await handleSetRequiredDuration(totalSeconds);
    handleLockKeyholderControls();
  };
  
  const [rewardDays, setRewardDays] = useState('');
  const [rewardOther, setRewardOther] = useState('');
  const [punishDays, setPunishDays] = useState('');
  const [punishOther, setPunishOther] = useState('');

  const handleSimpleReward = async () => {
    const secs = (parseInt(rewardDays, 10) || 0) * 86400;
    // THE FIX: Calling the specific handler from props
    await handleAddReward({ timeSeconds: secs, other: rewardOther });
    setRewardDays(''); setRewardOther('');
  };

  const handleSimplePunishment = async () => {
    const secs = (parseInt(punishDays, 10) || 0) * 86400;
    // THE FIX: Calling the specific handler from props
    await handleAddPunishment({ timeSeconds: secs, other: punishOther });
    setPunishDays(''); setPunishOther('');
  };

  return (
    <>
      <div className="mb-8 p-4 bg-gray-900/50 border-2 border-keyholder rounded-2xl shadow-lg shadow-red-500/20">
        <h3 className="title-red !text-red-300">Keyholder Dashboard</h3>
        {!keyholderName ? (
          <>
            <input type="text" value={khNameInput} onChange={e => setKhNameInput(e.target.value)} placeholder="Keyholder's Name" className="inputbox-red !text-red-300" />
            <button onClick={onSetKeyholder} disabled={!isAuthReady || !khNameInput.trim()} className="button-red !text-red-300">Set Keyholder</button>
          </>
        ) : (
          <>
            <p className="text-keyholder mb-2">Keyholder: <strong>{keyholderName}</strong></p>
            {!isKeyholderModeUnlocked ? (
              <>
                <p className="text-sm my-2 text-keyholder">Enter the keyholder password to unlock controls.</p>
                <input type="password" value={khPasswordInput} onChange={e => setKhPasswordInput(e.target.value)} placeholder="Enter Password" className="inputbox-red !text-red-300" />
                <button onClick={onUnlockControls} className="button-red !text-red-300">Unlock Controls</button>
              </>
            ) : (
              <div className="space-y-6">
                <div className="alert alert-success"><p>Controls Unlocked</p></div>
                <div className="p-4 border border-green-500 rounded-lg">
                  <h4 className="title-green !text-green-300 mb-2">Set Permanent Password</h4>
                   <div className="space-y-2">
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Permanent Password" className="inputbox-green w-full" />
                    <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Confirm New Password" className="inputbox-green w-full" />
                  </div>
                  <button onClick={onSetPermanentPassword} className="button-green !text-green-300 mt-2">Set Custom Password</button>
                </div>
                <hr className="my-4 border-purple-700"/>
                <div>
                  <p className="text-blue mb-2">Required Duration: {requiredKeyholderDurationSeconds ? formatElapsedTime(requiredKeyholderDurationSeconds) : 'Not Set'}</p>
                   <div className="grid grid-cols-1 gap-2 mb-3">
                    <input type="number" value={khRequiredDurationDays} onChange={e => setKhRequiredDurationDays(e.target.value)} placeholder="Set Duration in Days" className="inputbox-blue !text-blue-300 bg-transparent" />
                  </div>
                  <button onClick={onSetKHRequiredDurationAndLock} className="button-blue !text-blue-300">Update & Lock</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="title-yellow !text-yellow-300">Manual Reward</h4>
                    <input type="number" value={rewardDays} onChange={e=>setRewardDays(e.target.value)} placeholder="Subtract Days" className="inputbox-yellow !text-yellow-300 bg-transparent mb-2" />
                    <input type="text" value={rewardOther} onChange={e=>setRewardOther(e.target.value)} placeholder="Note (optional)" className="inputbox-yellow !text-yellow-300 w-full mb-2 bg-transparent" />
                    <button onClick={handleSimpleReward} className="button-yellow !text-yellow-300 mt-2">Add Reward</button>
                  </div>
                  <div>
                    <h4 className="title-red !text-red-300">Manual Punishment</h4>
                    <input type="number" value={punishDays} onChange={e=>setPunishDays(e.target.value)} placeholder="Add Days" className="inputbox-red !text-red-300 bg-transparent mb-2" />
                    <input type="text" value={punishOther} onChange={e=>setPunishOther(e.target.value)} placeholder="Note (optional)" className="inputbox-red !text-red-300 w-full mb-2 bg-transparent" />
                    <button onClick={handleSimplePunishment} className="button-red !text-red-300 mt-2">Add Punishment</button>
                  </div>
                </div>
                <hr className="my-4 border-purple-700"/>
                {/* These components now correctly receive their respective handlers */}
                <TaskApprovalSection tasks={tasks} onApprove={handleApproveTask} onReject={handleRejectTask} />
                {/* THE FIX: `onAddTask` now correctly calls `handleAddTask` from props */}
                <KeyholderAddTaskForm onAddTask={handleAddTask} />
                <button onClick={onManageRules} className="button-blue !text-blue-300 mt-2">Manage Rules</button>
              </div>
            )}
          </>
        )}
      </div>
      {isPasswordModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border-2 border-yellow-500 rounded-lg shadow-2xl p-6 w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4">Your Keyholder Password</h2>
            <div className="bg-gray-900 p-4 rounded-lg my-4 border border-gray-600">
              <p className="text-3xl font-mono tracking-widest text-white select-all">{modalPassword}</p>
            </div>
            <button onClick={() => setIsPasswordModalVisible(false)} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg">I have saved this</button>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyholderDashboard;