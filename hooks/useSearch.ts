
import { useState, useRef, useEffect } from 'react';
import { AppState, SearchParams, BusinessContact } from '../types';
import { searchBusinesses } from '../services/geminiService';

export const useSearch = (onSearchSuccess: (params: SearchParams, count: number) => void) => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [params, setParams] = useState<SearchParams>({
    location: '',
    niche: '',
    type: '',
    radius: '',
    whatsappOnly: false,
    deepSearchWeb: false,
    deepSearchInstagram: false,
    deepSearchFacebook: false,
    deepSearchLinkedin: false
  });
  const [results, setResults] = useState<BusinessContact[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const searchRequestId = useRef(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state === AppState.SEARCHING || isLoadingMore) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state, isLoadingMore]);

  const getErrorMessage = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object') {
      if (err.message) return String(err.message);
      if (err.error?.message) return String(err.error.message);
      try { return JSON.stringify(err); } catch { return "Erro desconhecido"; }
    }
    return String(err);
  };

  const handleSearch = async (e: React.FormEvent | React.MouseEvent, isFastMode: boolean = false) => {
    if (e) e.preventDefault();
    
    if (!params.location || !params.niche) {
      const form = document.getElementById('search-form') as HTMLFormElement;
      if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
      }
      return;
    }

    setState(AppState.SEARCHING);
    setResults([]);
    setErrorMsg('');
    setElapsedTime(0);
    setIsLoadingMore(false);
    
    const searchParams = { ...params, fastMode: isFastMode };
    setParams(searchParams);
    searchRequestId.current++;

    try {
      const data = await searchBusinesses(searchParams);
      setResults(data);
      setState(AppState.RESULTS);
      if (data.length > 0) {
        onSearchSuccess(searchParams, data.length);
      }
    } catch (err: any) {
      setState(AppState.ERROR);
      let msg = getErrorMessage(err);
      if (msg === '{}' || msg === '[object Object]') msg = "Ocorreu um erro interno na API. Tente novamente.";
      setErrorMsg(msg);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) {
      setIsLoadingMore(false);
      searchRequestId.current++;
      return;
    }

    if (window.confirm("O sistema irá EXPANDIR O RAIO DE BUSCA para encontrar novas empresas em regiões mais distantes. Deseja continuar?")) {
      setIsLoadingMore(true);
      searchRequestId.current++;
      const currentRequestId = searchRequestId.current;
      
      try {
        const currentNames = results.map(r => r.nome);
        const newContacts = await searchBusinesses({
          ...params,
          excludeNames: currentNames
        });
        
        if (currentRequestId !== searchRequestId.current) return;
        
        if (newContacts.length === 0) {
           alert("Não foram encontrados novos contatos mesmo expandindo a área.");
        } else {
           const updatedResults = [...results, ...newContacts];
           setResults(updatedResults);
           onSearchSuccess(params, updatedResults.length);
        }
      } catch (err: any) {
         if (currentRequestId !== searchRequestId.current) return;
         alert("Erro ao carregar mais: " + getErrorMessage(err));
      } finally {
         if (currentRequestId === searchRequestId.current) setIsLoadingMore(false);
      }
    }
  };

  return {
    state, params, setParams, results, errorMsg, elapsedTime, isLoadingMore, handleSearch, handleLoadMore
  };
};
