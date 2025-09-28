import React, { useState } from 'react';
import { getAuth, reauthenticateWithPopup, deleteUser, GoogleAuthProvider } from 'firebase/auth';

const AccountDeleteModal = ({ 
    isOpen, 
    onClose, 
    handleResetAllData 
}) => {
    const [deleteMessage, setDeleteMessage] = useState('');

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
                onClose();
                setDeleteMessage('');
            }, 5000);
            return;
        }

        try {
            setDeleteMessage("Deleting all data and account...");
            await handleResetAllData(true);
            await deleteUser(currentUser);
            
            setDeleteMessage("Account and all data permanently deleted.");
            setTimeout(() => {
                window.location.reload();
            }, 4000);

        } catch (error) {
            console.error("Error during final account deletion:", error);
            setDeleteMessage(`Deletion failed: ${error.message}. Please sign out and sign back in.`);
            setTimeout(() => setDeleteMessage(''), 5000);
        }
    };

    const handleCancel = () => {
        onClose();
        setDeleteMessage('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-red-700 rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold text-red-400 mb-3">Permanent Account Deletion</h2>
                <p className="text-sm text-gray-300 mb-4">
                    This will permanently delete your Google account link AND all associated tracker data. This action cannot be undone.
                </p>
                <p className="text-sm text-yellow-300 mb-4">
                    You will be asked to sign in with Google again to confirm this is your account.
                </p>
                {deleteMessage && (
                    <p className="text-sm font-bold text-center text-yellow-300 my-3">{deleteMessage}</p>
                )}
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={handleCancel}
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
    );
};

export default AccountDeleteModal;