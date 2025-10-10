import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, reauthenticateWithPopup, deleteUser } from 'firebase/auth';

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
  const [deleteMessage, setDeleteMessage] = useState('');

  const handleGoogleSignIn = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    
    try {
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener in useChastityState will handle the rest.
    } catch (error) {
      console.error('❌ Google Sign-In Error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        alert(`Google Sign-In failed: ${error.message}`);
      }
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      // Using alert as a placeholder for user feedback since toastify was removed
      alert('You have been signed out.');
    } catch (error) {
      console.error('❌ Sign-out failed:', error);
    }
  };

  const handleDeleteAccountAndReset = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || currentUser.isAnonymous) {
        setDeleteMessage("No authenticated account to delete.");
        setTimeout(() => setDeleteMessage(''), 4000);
        return;
    }
    
    const provider = new GoogleAuthProvider();
    try {
        setDeleteMessage("Please re-authenticate with Google to confirm account deletion.");
        await reauthenticateWithPopup(currentUser, provider);
    } catch (error) {
        console.error("Re-authentication for deletion failed:", error);
        setDeleteMessage(`Re-authentication failed. Deletion cancelled. Error: ${error.code}`);
        setTimeout(() => {
          setShowConfirmDelete(false);
          setDeleteMessage('');
        }, 5000);
        return;
    }

    try {
      setDeleteMessage("Deleting all data and account...");
      // First, reset all Firestore data
      await handleResetAllData(true); 

      // Now, delete the user from Firebase Authentication
      await deleteUser(currentUser);
      
      setDeleteMessage("Account and all data permanently deleted.");
      setTimeout(() => {
        window.location.reload(); // Reload to ensure a clean state
      }, 4000);

    } catch (error) {
        console.error("Error during final account deletion:", error);
        setDeleteMessage(`Deletion failed: ${error.message}. Please sign out and sign back in.`);
        setTimeout(() => setDeleteMessage(''), 5000);
    }
  };

  return (
    <div className="mb-8 p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold text-purple-300 mb-4">Profile & Account</h3>

      {user && !user.isAnonymous && (
        <div className="text-left mb-4 bg-gray-700 p-3 rounded-md border border-green-500">
          <p className="text-sm text-green-400 font-medium">
            ✅ Google Account Linked:
            <span className="block font-mono text-green-100 mt-1">{googleEmail}</span>
          </p>
        </div>
      )}

      {!savedSubmissivesName && isAuthReady && (
        <div className="mb-4">
          <label htmlFor="settingsSubmissivesName" className="block text-sm font-medium text-purple-300 mb-1 text-left">
            Submissive's Name: (Not Set)
          </label>
          <div className="flex flex-col sm:flex-row items-center sm:space-x-3">
            <input
              type="text"
              id="settingsSubmissivesName"
              value={submissivesNameInput || ''}
              onChange={handleSubmissivesNameInputChange}
              placeholder="Enter Submissive's Name"
              className="w-full sm:w-auto px-3 py-1.5 rounded-md border border-purple-600 bg-gray-900 text-gray-50 text-sm focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              type="button"
              onClick={handleSetSubmissivesName}
              disabled={!isAuthReady || !(submissivesNameInput || '').trim()}
              className="w-full mt-2 sm:mt-0 sm:w-auto bg-purple-600 hover:bg-purple-700 text-white text-sm py-1.5 px-3 rounded-md shadow-sm transition duration-300 disabled:opacity-50"
            >
              Set Name
            </button>
          </div>
        </div>
      )}

      {savedSubmissivesName && (
        <div className="mb-4 text-left">
          <p className="text-sm font-medium text-purple-300">Submissive's Name:</p>
          <p className="text-lg text-purple-100">{savedSubmissivesName}</p>
        </div>
      )}

      {nameMessage && (
        <p className={`text-xs mt-2 mb-3 text-left ${nameMessage.includes('successfully') || nameMessage.includes('set') ? 'text-green-400' : 'text-yellow-400'}`}>
          {nameMessage}
        </p>
      )}

      <hr className="my-4 border-purple-600" />

      {(!user || user.isAnonymous) && (
        <div>
          <h4 className="text-lg font-medium text-purple-200 mb-2 text-left">Account Sync & Backup</h4>
            <p className="text-xs text-purple-400 mb-3 text-left">
                Your data is currently only stored on this device. Sign in with Google to sync your data across devices and prevent data loss.
            </p>
            <div className="mt-4 text-left">
                <button
                    onClick={handleGoogleSignIn}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition"
                >
                    Sign In with Google
                </button>
            </div>
            <hr className="my-4 border-purple-600" />
            <h4 className="text-lg font-medium text-purple-200 mb-2 text-left">Anonymous Account ID</h4>
            <button
                type="button"
                onClick={handleToggleUserIdVisibility}
                disabled={!isAuthReady}
                className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 mb-3"
            >
                {showUserIdInSettings ? 'Hide User ID' : 'Show User ID'}
            </button>
            {showUserIdInSettings && userId && (
                <div className="p-3 bg-gray-700 rounded-md text-left">
                  <p className="text-sm text-purple-300">
                    Your Anonymous User ID: <span className="font-mono text-purple-100 select-all">{userId}</span>
                  </p>
                </div>
            )}
        </div>
      )}

      {user && !user.isAnonymous && (
        <div className="mt-6 text-left space-y-3">
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition"
          >
            Sign Out of Google
          </button>
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="w-full sm:w-auto bg-red-700 hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition ml-0 sm:ml-4 mt-2 sm:mt-0"
          >
            Delete Google Account & All Data
          </button>
        </div>
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-700 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-red-400 mb-3">Permanent Account Deletion</h2>
            <p className="text-sm text-gray-300 mb-4">
              This will permanently delete your Google account link AND all associated tracker data. This action cannot be undone.
            </p>
            <p className="text-sm text-yellow-300 mb-4">
              You will be asked to sign in with Google again to confirm this is your account.
            </p>
            {deleteMessage && <p className="text-sm font-bold text-center text-yellow-300 my-3">{deleteMessage}</p>}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowConfirmDelete(false); setDeleteMessage(''); }}
                className="px-4 py-2 bg-gray-600 text-sm rounded-md hover:bg-gray-700 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccountAndReset}
                className="px-4 py-2 bg-red-600 text-sm rounded-md hover:bg-red-700 text-white"
              >
                Confirm & Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSection;
