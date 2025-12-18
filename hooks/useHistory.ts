
import { useState, useEffect } from 'react';
import { SearchHistoryItem, SearchParams, User } from '../types';
import { db } from '../services/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  doc, 
  writeBatch,
  getDocs
} from 'firebase/firestore';

export const useHistory = (user: User | null) => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!user) {
      setSearchHistory([]);
      return;
    }

    const q = query(
      collection(db, "searches"),
      where("userId", "==", user.id),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SearchHistoryItem[];
      setSearchHistory(historyItems);
    });

    return () => unsubscribe();
  }, [user]);

  const addToHistory = async (params: SearchParams, count: number) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "searches"), {
        userId: user.id,
        timestamp: Date.now(),
        params: { ...params },
        resultCount: count
      });
    } catch (e) {
      console.error("Erro ao salvar histórico no Firebase", e);
    }
  };

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, "searches", id));
    } catch (e) {
      console.error("Erro ao deletar item", e);
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    if (window.confirm("Deseja realmente limpar todo o histórico na nuvem?")) {
      const q = query(collection(db, "searches"), where("userId", "==", user.id));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  };

  return {
    searchHistory, showHistory, setShowHistory, addToHistory, deleteHistoryItem, clearHistory
  };
};
