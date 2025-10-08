import React from "react";

export const DisplaySettingsSection: React.FC = () => {
  return (
    <div className="bg-white/10 backdrop-blur-xs border-white/20 p-4 rounded-lg">
      <h2 className="text-2xl font-bold text-nightly-honeydew">
        Display Settings
      </h2>
      <p className="text-nightly-celadon">Manage your display preferences.</p>
    </div>
  );
};
