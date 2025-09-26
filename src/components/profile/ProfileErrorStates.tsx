/**
 * ProfileErrorStates Component
 * Displays various error and loading states - pure presentation component
 */

import React from "react";
import { FaUser, FaShieldAlt } from "../../utils/iconImport";

export const ProfileLoadingState: React.FC = () => (
  <div className="text-nightly-spring-green">
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-nightly-aquamarine border-t-transparent rounded-full mb-4 mx-auto"></div>
        <div className="text-nightly-celadon">Loading profile...</div>
      </div>
    </div>
  </div>
);

export const ProfileNotFoundState: React.FC = () => (
  <div className="text-nightly-spring-green">
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <FaUser className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
        <div className="text-nightly-celadon">Profile not found</div>
        <div className="text-sm text-nightly-celadon/70">
          This user doesn't exist or their profile is private
        </div>
      </div>
    </div>
  </div>
);

export const ProfilePrivateState: React.FC = () => (
  <div className="text-nightly-spring-green">
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <FaShieldAlt className="text-4xl text-nightly-celadon/50 mb-4 mx-auto" />
        <div className="text-nightly-celadon">Private Profile</div>
        <div className="text-sm text-nightly-celadon/70">
          This user has set their profile to private
        </div>
      </div>
    </div>
  </div>
);
