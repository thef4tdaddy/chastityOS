import React from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

const GoogleAuthSection = ({ user, googleEmail, onDeleteAccount }) => {
    const handleGoogleSignIn = async () => {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        
        try {
            await signInWithPopup(auth, provider);
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
            alert('You have been signed out.');
        } catch (error) {
            console.error('❌ Sign-out failed:', error);
        }
    };

    if (user && !user.isAnonymous) {
        return (
            <>
                <div className="text-left mb-4 bg-gray-700 p-3 rounded-md border border-green-500">
                    <p className="text-sm text-green-400 font-medium">
                        ✅ Google Account Linked:
                        <span className="block font-mono text-green-100 mt-1">{googleEmail}</span>
                    </p>
                </div>
                <div className="mt-6 text-left space-y-3">
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition"
                    >
                        Sign Out of Google
                    </button>
                    <button
                        onClick={onDeleteAccount}
                        className="w-full sm:w-auto bg-red-700 hover:bg-red-800 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition ml-0 sm:ml-4 mt-2 sm:mt-0"
                    >
                        Delete Google Account & All Data
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
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
        </>
    );
};

export default GoogleAuthSection;