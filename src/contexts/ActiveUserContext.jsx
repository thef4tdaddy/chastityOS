import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ActiveUserContext = createContext();

export const ActiveUserProvider = ({ children }) => {
  const [activeUserId, setActiveUserId] = useState(auth.currentUser?.uid || null);

  useEffect(() => {
    const init = async () => {
      if (!auth.currentUser) return;
      const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.linkedKeyholderId) {
          setActiveUserId(data.linkedKeyholderId);
        }
      }
    };
    init();
  }, []);

  return (
    <ActiveUserContext.Provider value={{ activeUserId, setActiveUserId }}>
      {children}
    </ActiveUserContext.Provider>
  );
};