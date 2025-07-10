import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ActiveUserContext = createContext();

export const ActiveUserProvider = ({ children }) => {
  const [activeUserId, setActiveUserId] = useState(auth.currentUser?.uid || null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        let id = user.uid;
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.linkedKeyholderId) {
              id = data.linkedKeyholderId;
            }
          }
        } catch (err) {
          console.error('Failed to fetch linked keyholder ID:', err);
        }
        setActiveUserId(id);
      } else {
        setActiveUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <ActiveUserContext.Provider value={{ activeUserId, setActiveUserId }}>
      {children}
    </ActiveUserContext.Provider>
  );
};

export { ActiveUserContext };