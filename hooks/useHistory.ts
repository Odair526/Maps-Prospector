// Added missing React import to resolve namespace errors for event types
import React, { useState, useEffect } from 'react';
import { SearchHistoryItem, SearchParams, User } from '../types';
import { db } from '../services/firebase';

export const useHistory = (user: User | null) => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!user) {
      setSearchHistory([]);
      return;
    }

    // Use compat Firestore query syntax
    const unsubscribe = db.collection("searches")
      .where("userId", "==", user.id)
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
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
      await db.collection("searches").add({
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
      await db.collection("searches").doc(id).delete();
    } catch (e) {
      console.error("Erro ao deletar item", e);
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    if (window.confirm("Deseja realmente limpar todo o histórico na nuvem?")) {
      try {
        const snapshot = await db.collection("searches").where("userId", "==", user.id).get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      } catch (e) {
        console.error("Erro ao limpar histórico", e);
      }
    }
  };

  return {
    searchHistory, showHistory, setShowHistory, addToHistory, deleteHistoryItem, clearHistory
  };
};