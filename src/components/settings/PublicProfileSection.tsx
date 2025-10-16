import React from "react";

export const PublicProfileSection: React.FC = () => {
  return (
    <div className="bg-white/10 backdrop-blur-xs border-white/20 p-4 rounded-lg">
      <h2 className="text-2xl font-bold text-nightly-honeydew">
        Public Profile
      </h2>
      <p className="text-nightly-celadon">
        Manage your public profile settings.
      </p>
    </div>
  );
};
