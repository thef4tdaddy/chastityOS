
import React from 'react';

interface KeyholderRequirementProps {
  keyholderName: string;
  savedSubmissivesName: string;
  requiredKeyholderDurationSeconds: number;
}

export const KeyholderRequirement: React.FC<KeyholderRequirementProps> = ({ keyholderName, savedSubmissivesName, requiredKeyholderDurationSeconds }) => {
  return (
    <div className={`mb-4 p-3 rounded-lg shadow-sm text-center border bg-white/10 backdrop-blur-xs border-white/20`}>
      <p className={`text-sm font-semibold text-purple-200`}>
        {keyholderName} requires {savedSubmissivesName || 'the submissive'} to be in chastity for {requiredKeyholderDurationSeconds}
      </p>
    </div>
  );
};
