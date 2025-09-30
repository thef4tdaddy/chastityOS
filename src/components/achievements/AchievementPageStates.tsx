import React from "react";
import { FaTrophy } from "../../utils/iconImport";

export const AchievementLoadingState: React.FC = () => (
  <div className="text-nightly-spring-green">
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-nightly-aquamarine border-t-transparent rounded-full mb-4 mx-auto"></div>
        <div className="text-nightly-celadon">Loading achievements...</div>
      </div>
    </div>
  </div>
);

export const AchievementSignInPrompt: React.FC = () => (
  <div className="text-nightly-spring-green">
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <FaTrophy className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
        <div className="text-nightly-celadon">
          Please sign in to view achievements
        </div>
      </div>
    </div>
  </div>
);