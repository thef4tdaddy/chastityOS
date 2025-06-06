// src/components/settings/AccountSection.jsx
import React, { useState, useEffect } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, linkWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';

const AccountSection = ({
  isAuthReady,
  savedSubmissivesName,
  submissivesNameInput,
  handleSubmissivesNameInputChange,
  handleSetSubmissivesName,
  showUserIdInSettings,
  handleToggleUserIdVisibility,
  userId,
  nameMessage
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [googleEmail, setGoogleEmail] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user && !user.isAnonymous && user.email) {
      setGoogleEmail(user.email);
    }
  }, [isAuthReady]);

  const handleGoogleSignIn = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    try {
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        const result = await linkWithPopup(auth.currentUser, provider);
        console.log('✅ Anonymous user linked to Google:', result.user);
        // GTM/GA4 login event
        window.gtag && window.gtag('event', 'login', {
          method: 'Google',
          user_id: result.user.uid,
          email: result.user.email
        });
        setGoogleEmail(result.user.email);
      } else {
        const result = await signInWithPopup(auth, provider);
        console.log('✅ Signed in with Google:', result.user);
        // GTM/GA4 login event
        window.gtag && window.gtag('event', 'login', {
          method: 'Google',
          user_id: result.user.uid,
          email: result.user.email
        });
        setGoogleEmail(result.user.email);
      }
    } catch (error) {
      console.error('❌ Google Sign-In Error:', error);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      // GTM/GA4 logout event
      window.gtag && window.gtag('event', 'logout', {
        method: 'Google'
      });
      alert('You have been signed out.');
      setGoogleEmail(null);
    } catch (error) {
      console.error('❌ Sign-out failed:', error);
    }
  };

  const handleDeleteAccountAndReset = async () => {
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;

    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);
      // GTM/GA4 delete_account event
      window.gtag && window.gtag('event', 'delete_account', {
        method: 'Google',
        user_id: user.uid,
        email: user.email
      });
      await signOut(auth);
      await auth.signInAnonymously();
      console.log('✅ User data deleted. Signed back in anonymously.');
      alert('Your data has been deleted and you are now signed in anonymously.');
      setShowConfirmDelete(false);
      setGoogleEmail(null);
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      alert('Something went wrong while deleting your data.');
    }
  };

  return (
    <div className="mb-8 p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold text-purple-300 mb-4">Profile Information</h3>

      {googleEmail && (
        <div className="text-left mb-4 bg-gray-700 p-3 rounded-md border border-green-500">
          <p className="text-sm text-green-400 font-medium">
            ✅ Google Account Linked:
            <span className="block font-mono text-green-100 mt-1">{googleEmail}</span>
          </p>
          <p className="text-xs text-green-300 mt-1">
            Your data is now synced to this Google account. Your anonymous User ID is no longer needed.
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
          <p className="text-xs text-purple-400">(To change, use "Reset All Application Data" below.)</p>
        </div>
      )}

      {nameMessage && (
        <p className={`text-xs mt-2 mb-3 text-left ${nameMessage.includes('successfully') || nameMessage.includes('set') ? 'text-green-400' : 'text-yellow-400'}`}>
          {nameMessage}
        </p>
      )}

      {!googleEmail && (
        <div>
          <h4 className="text-lg font-medium text-purple-200 mb-2 text-left">Account ID</h4>
          {!googleEmail && isAuthReady && (
            <>
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
                    Your User ID: <span className="font-mono text-purple-100 select-all">{userId}</span>
                  </p>
                  <p className="text-xs text-purple-400 mt-1">
                    (This ID is used for anonymous data syncing. If you sign in with Google, this ID will no longer be used.)
                  </p>
                </div>
              )}

              {showUserIdInSettings && !userId && isAuthReady && (
                <p className="text-sm text-yellow-400 bg-gray-700 p-2 rounded text-left">
                  User ID not available yet. Please wait for authentication to complete.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {isAuthReady && !googleEmail && (
        <div className="mt-6 text-left">
          <button
            onClick={handleGoogleSignIn}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition"
          >
            Link your account with Google
          </button>
        </div>
      )}

      {googleEmail && (
        <div className="mt-6 text-left space-y-3">
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition"
          >
            Sign Out Only
          </button>
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="w-full sm:w-auto bg-red-700 hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition"
          >
            Delete All Synced Data & Reset
          </button>
        </div>
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-red-700 rounded-lg shadow-lg p-6 w-11/12 max-w-md">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Delete All Data</h2>
            <p className="text-sm text-gray-300 mb-4">
              This will permanently delete all your synced data and return you to anonymous mode. Are you sure?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-gray-600 text-sm rounded-md hover:bg-gray-700 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccountAndReset}
                className="px-4 py-2 bg-red-600 text-sm rounded-md hover:bg-red-700 text-white"
              >
                Delete & Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSection;