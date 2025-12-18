
import { useState, useMemo } from 'react';
import { BusinessContact } from '../types';

export const useResultsFilter = (results: BusinessContact[]) => {
  const [filters, setFilters] = useState({
    name: '',
    selectedDDD: null as string | null,
    whatsappMode: 'all', 
    ratingMode: 'all',
    minReviews: ''
  });

  const availableDDDs = useMemo(() => {
    const ddds = new Set<string>();
    results.forEach(contact => {
      const phone = contact.telefone || '';
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 2) {
        ddds.add(digits.substring(0, 2));
      }
    });
    return Array.from(ddds).sort();
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(contact => {
      if (filters.name && !contact.nome.toLowerCase().includes(filters.name.toLowerCase())) return false;
      
      if (filters.selectedDDD) {
        const phone = contact.telefone || '';
        const cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone.startsWith(filters.selectedDDD)) return false;
      }

      if (filters.whatsappMode === 'with_whatsapp' && !contact.whatsapp) return false;
      if (filters.whatsappMode === 'no_whatsapp' && contact.whatsapp) return false;

      const rating = contact.rating || 0;
      if (filters.ratingMode === 'positive' && rating < 4.0) return false;
      if (filters.ratingMode === 'negative' && rating >= 4.0) return false;
      
      if (filters.minReviews) {
        const min = parseInt(filters.minReviews);
        if (!isNaN(min) && (contact.reviewCount || 0) < min) return false;
      }

      return true;
    });
  }, [results, filters]);

  return {
    filters,
    setFilters,
    filteredResults,
    availableDDDs
  };
};
