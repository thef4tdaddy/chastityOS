import React, { useState, useEffect } from 'react';
// IMPORTANT: You will need to adjust this path to match your project structure.
import { formatElapsedTime } from '../../utils.js';

const KeyholderControls = ({
    keyholderMessage,
    handleSetPermanentPassword,
    requiredKeyholderDurationSeconds,
    handleSetRequiredDuration,
    handleLockKeyholderControls,
    handleAddReward,
    handleAddPunishment
}) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [khRequiredDurationDays, setKhRequiredDurationDays] = useState('');
    const [rewardDays, setRewardDays] = useState('');
    const [rewardOther, setRewardOther] = useState('');
    const [punishDays, setPunishDays] = useState('');
    const [punishOther, setPunishOther] = useState('');

    useEffect(() => {
        if (requiredKeyholderDurationSeconds) {
            const days = Math.floor(requiredKeyholderDurationSeconds / 86400);
            setKhRequiredDurationDays(days.toString());
        } else {
            setKhRequiredDurationDays('');
        }
    }, [requiredKeyholderDurationSeconds]);

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
        await handleSetRequiredDuration(totalSeconds);
        handleLockKeyholderControls();
    };

    const onAddReward = async () => {
        const secs = (parseInt(rewardDays, 10) || 0) * 86400;
        await handleAddReward({ timeSeconds: secs, other: rewardOther });
        setRewardDays('');
        setRewardOther('');
    };

    const onAddPunishment = async () => {
        const secs = (parseInt(punishDays, 10) || 0) * 86400;
        await handleAddPunishment({ timeSeconds: secs, other: punishOther });
        setPunishDays('');
        setPunishOther('');
    };

    return (
        <>
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
        </>
    );
};

export default KeyholderControls;
