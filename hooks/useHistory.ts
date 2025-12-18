
import { useState, useEffect } from 'react';
import { SearchHistoryItem, SearchParams, User } from '../types';

export const useHistory = (user: User | null) => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem('prospector_history');
      if (savedHistory) {
        try {
          setSearchHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to load history", e);
        }
      }
    }
  }, [user]);

  const addToHistory = (params: SearchParams, count: number) => {
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      params: { ...params },
      resultCount: count
    };

    const newHistory = [newItem, ...searchHistory].slice(0, 50);
    setSearchHistory(newHistory);
    localStorage.setItem('prospector_history', JSON.stringify(newHistory));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(item => item.id !== id);
    setSearchHistory(newHistory);
    localStorage.setItem('prospector_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    if (window.confirm("Deseja realmente limpar todo o histórico?")) {
      setSearchHistory([]);
      localStorage.removeItem('prospector_history');
    }
  };

  return {
    searchHistory,
    showHistory,
    setShowHistory,
    addToHistory,
    deleteHistoryItem,
    clearHistory
  };
};
