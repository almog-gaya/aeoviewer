'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Firestore, collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase';

interface FirebaseContextProps {
  db: Firestore;
  recentScans: any[];
  loading: boolean;
  refreshScans: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextProps>({
  db,
  recentScans: [],
  loading: true,
  refreshScans: async () => {}
});

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider = ({ children }: FirebaseProviderProps) => {
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentScans = async () => {
    setLoading(true);
    try {
      const scansQuery = query(
        collection(db, 'scans'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(scansQuery);
      const scans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRecentScans(scans);
    } catch (error) {
      console.error('Error fetching recent scans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentScans();
  }, []);

  const contextValue = {
    db,
    recentScans,
    loading,
    refreshScans: fetchRecentScans
  };

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);

export default FirebaseContext; 