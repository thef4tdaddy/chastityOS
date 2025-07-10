import React, { useState, useEffect } from 'react';
import { generateKeyholderToken, getUserIdFromKeyholderToken, createAccountLinkForLinkedUid, deleteKeyholderToken, deleteAccountLink } from '../../utils/keyholderLink';
import { auth, db } from '../../firebase'; // Assuming auth and db are imported from firebase config
import { getDoc, doc } from 'firebase/firestore';

const KeyholderLinkSection = ({ userId, setSettings, linkedKeyholderId, setActiveUserId }) => {
  const [shareToken, setShareToken] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [message, setMessage] = useState('');
  const [linkInfo, setLinkInfo] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('kh');
    if (tokenFromUrl) {
      setInputToken(tokenFromUrl);
    }
  }, []);

  useEffect(() => {
    if (linkedKeyholderId) {
      const fetchLinkInfo = async () => {
        const docId = `${auth.currentUser.uid}_${linkedKeyholderId}`;
        const docRef = doc(db, 'accountLinks', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLinkInfo(docSnap.data());
        }
      };
      fetchLinkInfo();
    }
  }, [linkedKeyholderId]);

  const handleGenerate = async () => {
    try {
      console.log('handleGenerate called. userId:', userId);
      const token = await generateKeyholderToken(userId);
      console.log('Generated token:', token);
      setShareToken(token || '');
    } catch (err) {
      console.error('Error generating token:', err);
      setMessage('Error generating token');
    }
  };

  const handleLink = async () => {
    const uid = await getUserIdFromKeyholderToken(inputToken.trim());
    if (uid) {
      try {
        await createAccountLinkForLinkedUid(auth.currentUser.uid, uid);
        // Fetch the created accountLinks doc
        const docId = `${auth.currentUser.uid}_${uid}`;
        const docRef = doc(db, 'accountLinks', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLinkInfo(docSnap.data());
        }
        setSettings(prev => ({ ...prev, linkedKeyholderId: uid }));
        setMessage('Linked successfully!');
        setActiveUserId(uid);
      } catch {
        setMessage('Failed to link account');
      }
    } else {
      setMessage('Invalid code');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRevoke = async () => {
    if (!linkedKeyholderId) return;
    try {
      await deleteAccountLink(auth.currentUser.uid, linkedKeyholderId);
      await deleteKeyholderToken(userId, linkedKeyholderId);
      setSettings(prev => ({ ...prev, linkedKeyholderId: null }));
      setMessage('Link revoked successfully');
      setActiveUserId(userId);
    } catch {
      setMessage('Failed to revoke link');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSwitchUser = () => {
    if (linkedKeyholderId) {
      setActiveUserId(linkedKeyholderId);
    }
  };

  return (
    <div className="mb-8 p-4 bg-gray-800 border border-indigo-700 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold text-indigo-300 mb-4">Keyholder Link</h3>
      <button onClick={handleGenerate} className="mb-3 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-1.5 px-3 rounded-md">
        Generate Share Code
      </button>
      {shareToken && (
        <div className="text-left mb-4 space-y-2">
          <div>
            <p className="text-sm text-purple-200 mb-1">Share this code with your keyholder:</p>
            <div className="bg-gray-900 p-2 rounded-md text-purple-100 text-sm break-all">
              {shareToken}
            </div>
          </div>
          <div>
            <p className="text-sm text-purple-200 mb-1">Or share this link:</p>
            <div className="bg-gray-900 p-2 rounded-md text-purple-100 text-sm break-all">
              {`${window.location.origin}?kh=${shareToken}`}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-center sm:space-x-3 mt-2">
        <input
          type="text"
          value={inputToken}
          onChange={(e) => setInputToken(e.target.value)}
          placeholder="Enter Keyholder Code"
          className="w-full sm:w-auto px-3 py-1.5 rounded-md border border-indigo-600 bg-gray-900 text-gray-50 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={handleLink}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-1.5 px-3 rounded-md mt-2 sm:mt-0"
        >
          Link Account
        </button>
      </div>
      {linkedKeyholderId && (
        <>
          <p className="text-sm text-green-400 mt-3 text-left">
            You are currently linked to: {linkedKeyholderId}
          </p>
          {linkInfo?.createdAt && (
            <p className="text-sm text-purple-300 mt-1 text-left">
              Linked since: {linkInfo.createdAt.toDate().toLocaleDateString()}
            </p>
          )}
          <div className="flex space-x-3 mt-2">
            <button
              type="button"
              onClick={handleSwitchUser}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-1.5 px-3 rounded-md"
            >
              Switch to Linked User
            </button>
            <button
              type="button"
              onClick={handleRevoke}
              className="bg-red-600 hover:bg-red-700 text-white text-sm py-1.5 px-3 rounded-md"
            >
              Revoke Link
            </button>
          </div>
        </>
      )}
      {message && (
        <p className="text-sm text-yellow-400 mt-2 text-left">{message}</p>
      )}
    </div>
  );
};

export default KeyholderLinkSection;
