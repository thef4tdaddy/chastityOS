import React, { useState } from 'react';
import GoogleAuthSection from './GoogleAuthSection';
import SubmissiveNameSection from './SubmissiveNameSection';
import UserIdSection from './UserIdSection';
import AccountDeleteModal from './AccountDeleteModal';

const AccountSection = ({
  isAuthReady,
  savedSubmissivesName,
  submissivesNameInput,
  handleSubmissivesNameInputChange,
  handleSetSubmissivesName,
  showUserIdInSettings,
  handleToggleUserIdVisibility,
  userId,
  nameMessage,
  handleResetAllData,
  user,
  googleEmail
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <div className="mb-8 p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold text-purple-300 mb-4">Profile & Account</h3>

      <SubmissiveNameSection
        isAuthReady={isAuthReady}
        savedSubmissivesName={savedSubmissivesName}
        submissivesNameInput={submissivesNameInput}
        handleSubmissivesNameInputChange={handleSubmissivesNameInputChange}
        handleSetSubmissivesName={handleSetSubmissivesName}
        nameMessage={nameMessage}
      />

      <hr className="my-4 border-purple-600" />

      {(!user || user.isAnonymous) && (
        <div>
          <GoogleAuthSection 
            user={user}
            googleEmail={googleEmail}
            onDeleteAccount={() => setShowConfirmDelete(true)}
          />
          <UserIdSection
            isAuthReady={isAuthReady}
            showUserIdInSettings={showUserIdInSettings}
            handleToggleUserIdVisibility={handleToggleUserIdVisibility}
            userId={userId}
          />
        </div>
      )}

      {user && !user.isAnonymous && (
        <GoogleAuthSection 
          user={user}
          googleEmail={googleEmail}
          onDeleteAccount={() => setShowConfirmDelete(true)}
        />
      )}

      <AccountDeleteModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        handleResetAllData={handleResetAllData}
      />
    </div>
  );
};

export default AccountSection;
