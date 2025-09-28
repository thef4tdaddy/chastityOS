import React from "react";
import { SpecialChallengeSection } from "@/components/goals/SpecialChallengeSection";

interface PersonalGoalSectionProps {
  userId?: string | null;
}

export const PersonalGoalSection: React.FC<PersonalGoalSectionProps> = ({
  userId,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-xs border-white/20 p-4 rounded-lg">
        <h2 className="text-2xl font-bold">Personal Goal</h2>
        <p>Manage your personal goal settings.</p>
      </div>

      <SpecialChallengeSection userId={userId || null} />
    </div>
  );
};
