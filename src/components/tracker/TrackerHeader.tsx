
import React from 'react';

interface TrackerHeaderProps {
    remainingGoalTime: number;
    keyholderName: string;
    savedSubmissivesName: string;
    requiredKeyholderDurationSeconds: number;
    isCageOn: boolean;
    denialCooldownActive: boolean;
    pauseCooldownMessage: string | null;
}

export const TrackerHeader: React.FC<TrackerHeaderProps> = ({ remainingGoalTime, keyholderName, savedSubmissivesName, requiredKeyholderDurationSeconds, isCageOn, denialCooldownActive, pauseCooldownMessage }) => {
    return (
        <>
            {pauseCooldownMessage && (
                <div className="mb-4 p-3 bg-yellow-600/30 border border-yellow-500 rounded-lg text-sm text-yellow-200">
                    {pauseCooldownMessage}
                </div>
            )}

            {isCageOn && remainingGoalTime > 0 && (
                <div className={`mb-4 p-3 rounded-lg shadow-sm text-center border bg-white/10 backdrop-blur-xs border-white/20`}>
                    <p className={`text-lg font-semibold text-blue-200`}>
                        Time Remaining on Goal:
                    </p>
                    <p className="text-3xl font-bold text-blue-100">
                        {remainingGoalTime}
                    </p>
                </div>
            )}

            {keyholderName && requiredKeyholderDurationSeconds > 0 && (
                <div className={`mb-4 p-3 rounded-lg shadow-sm text-center border bg-white/10 backdrop-blur-xs border-white/20`}>
                    <p className={`text-sm font-semibold text-purple-200`}>
                        {keyholderName} requires {savedSubmissivesName || 'the submissive'} to be in chastity for {requiredKeyholderDurationSeconds}
                    </p>
                </div>
            )}

            {denialCooldownActive && (
                <div>Denial cooldown active</div>
            )}
        </>
    )
}
