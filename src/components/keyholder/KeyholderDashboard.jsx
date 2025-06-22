import React, { useState, useEffect, useMemo } from 'react';
// IMPORTANT: You will need to adjust these paths to match your project structure.
import TaskReviewSection from './TaskReviewSection.jsx';
import AssignTaskSection from './AssignTaskSection.jsx';
import KeyholderControls from './KeyholderControls.jsx';

const KeyholderDashboard = (props) => {
    const {
        keyholderName,
        handleSetKeyholderName,
        handleKeyholderPasswordCheck,
        isKeyholderModeUnlocked,
        tasks = [],
        updateTaskStatus,
        keyholderMessage,
        isAuthReady,
    } = props;

    const [khNameInput, setKhNameInput] = useState('');
    const [khPasswordInput, setKhPasswordInput] = useState('');
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [modalPassword, setModalPassword] = useState('');
    const [reviewData, setReviewData] = useState({});

    const submittedTasks = useMemo(() => tasks.filter(task => task.status === 'submitted'), [tasks]);

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

    const handleReviewChange = (taskId, field, value) => {
        setReviewData(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [field]: value
            }
        }));
    };

    const handleTaskReview = async (taskId, newStatus) => {
        const taskReviewData = reviewData[taskId] || {};
        const keyholderNote = taskReviewData.note || '';
        const timeAdjustmentDays = parseInt(taskReviewData.days, 10) || 0;
        const task = tasks.find(t => t.id === taskId);
        
        const updateData = { keyholderNote };

        if (timeAdjustmentDays !== 0) {
            const timeSeconds = Math.abs(timeAdjustmentDays) * 86400;
            const outcomeText = `${timeAdjustmentDays > 0 ? 'Added' : 'Subtracted'} ${Math.abs(timeAdjustmentDays)} day(s).`;
            updateData.outcome = outcomeText;

            if (timeAdjustmentDays > 0) {
                await props.handleAddPunishment({ timeSeconds, other: `For task: ${task?.text || 'Completed Task'}` });
            } else {
                await props.handleAddReward({ timeSeconds, other: `For task: ${task?.text || 'Completed Task'}` });
            }
        }
        
        await updateTaskStatus(taskId, newStatus, updateData);

        setReviewData(prev => {
            const newData = { ...prev };
            delete newData[taskId];
            return newData;
        });
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
                                
                                <hr className="my-6 border-purple-700"/>
                                <TaskReviewSection
                                    submittedTasks={submittedTasks}
                                    reviewData={reviewData}
                                    handleReviewChange={handleReviewChange}
                                    handleTaskReview={handleTaskReview}
                                />
                                <hr className="my-6 border-purple-700"/>
                                <AssignTaskSection handleAddTask={props.handleAddTask} />
                                <hr className="my-4 border-purple-700"/>
                                <KeyholderControls {...props} />
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

export default KeyholderDashboard;
