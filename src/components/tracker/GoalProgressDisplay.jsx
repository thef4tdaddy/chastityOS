import React from 'react';
import { formatElapsedTime, formatDaysOnly } from '../../utils';

const GoalProgressDisplay = ({
    isCageOn,
    goalDurationSeconds,
    remainingGoalTime,
    keyholderName,
    requiredKeyholderDurationSeconds,
    savedSubmissivesName,
    effectiveTimeInChastityForGoal
}) => {
    return (
        <>
            {/* Personal Goal Progress */}
            {isCageOn && goalDurationSeconds > 0 && remainingGoalTime !== null && (
                <div className={`mb-4 p-3 rounded-lg shadow-sm text-center border ${
                    remainingGoalTime <= 0 ? 'bg-green-700 border-green-500' : 'bg-blue-800 border-blue-600'
                }`}>
                    <p className={`text-lg font-semibold ${
                        remainingGoalTime <= 0 ? 'text-green-200' : 'text-blue-200'
                    }`}>
                        {remainingGoalTime <= 0 ? "Goal Reached!" : "Time Remaining on Goal:"}
                    </p>
                    {remainingGoalTime > 0 && (
                        <p className="text-3xl font-bold text-blue-100">
                            {formatElapsedTime(remainingGoalTime)}
                        </p>
                    )}
                </div>
            )}

            {/* Keyholder Duration Progress */}
            {keyholderName && requiredKeyholderDurationSeconds > 0 && (
                <div className={`mb-4 p-3 rounded-lg shadow-sm text-center border ${
                    isCageOn && effectiveTimeInChastityForGoal >= requiredKeyholderDurationSeconds 
                        ? 'bg-pink-700 border-pink-500' 
                        : 'bg-purple-800 border-purple-600'
                }`}>
                    <p className={`text-sm font-semibold ${
                        isCageOn && effectiveTimeInChastityForGoal >= requiredKeyholderDurationSeconds 
                            ? 'text-pink-200' 
                            : 'text-purple-200'
                    }`}>
                        {keyholderName} requires {savedSubmissivesName || 'the submissive'} to be in chastity for {formatDaysOnly(requiredKeyholderDurationSeconds)}
                    </p>
                    {isCageOn && effectiveTimeInChastityForGoal < requiredKeyholderDurationSeconds && (
                        <p className="text-lg font-bold text-purple-100">
                            Time Left in required chastity: {formatElapsedTime(requiredKeyholderDurationSeconds - effectiveTimeInChastityForGoal)}
                        </p>
                    )}
                    {isCageOn && effectiveTimeInChastityForGoal >= requiredKeyholderDurationSeconds && (
                        <p className="text-lg font-bold text-pink-100">KH Duration Met!</p>
                    )}
                </div>
            )}
        </>
    );
};

export default GoalProgressDisplay;