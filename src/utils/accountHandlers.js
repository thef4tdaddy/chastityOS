import { getAuth, reauthenticateWithPopup, GoogleAuthProvider, deleteUser } from 'firebase/auth';

export const handleDeleteAccountAndReset = async (setDeleteMessage, setShowConfirmDelete, handleResetAllData) => {
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