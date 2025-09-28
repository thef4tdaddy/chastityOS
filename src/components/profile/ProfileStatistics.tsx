/**
 * ProfileStatistics Component
 * Displays stats cards and charts - pure presentation component
 */

import React from "react";
import { FaChartBar, FaLock } from "../../utils/iconImport";
import type { StatItem } from "../../hooks/profile/useProfileStats";

interface ProfileStatisticsProps {
  statItems: StatItem[];
  isPrivate: boolean;
}

const ProfileStatistics: React.FC<ProfileStatisticsProps> = ({
  statItems,
  isPrivate,
}) => {
  if (isPrivate) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6 text-center">
        <FaLock className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
        <div className="text-nightly-celadon">Statistics are private</div>
        <div className="text-sm text-nightly-celadon/70">
          This user has chosen to keep their statistics private
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <FaChartBar className="text-nightly-aquamarine" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">
          Statistics
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="text-center">
              <Icon className={`text-2xl mb-2 mx-auto ${item.color}`} />
              <div className="text-lg font-semibold text-nightly-honeydew mb-1">
                {item.value}
              </div>
              <div className="text-sm text-nightly-celadon">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileStatistics;
