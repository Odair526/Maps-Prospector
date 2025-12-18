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

  const getUserLocation = (): Promise<{ latitude: number; longitude: number } | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(undefined);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(undefined),
        { timeout: 5000 }
      );
    });
  };

  const handleSearch = async (e: React.FormEvent | React.MouseEvent, isFastMode: boolean = false) => {
    if (e) e.preventDefault();
    
    if (!params.location || !params.niche) return;

    setState(AppState.SEARCHING);
    setResults([]);
    setErrorMsg('');
    setElapsedTime(0);
    setIsLoadingMore(false);
    
    const searchParams = { ...params, fastMode: isFastMode };
    setParams(searchParams);
    searchRequestId.current++;

    try {
      const latLng = await getUserLocation();
      const data = await searchBusinesses(searchParams, latLng);
      setResults(data);
      setState(AppState.RESULTS);
      if (data.length > 0) {
        onSearchSuccess(searchParams, data.length);
      }
    } catch (err: any) {
      setState(AppState.ERROR);
      setErrorMsg(err.message || "Erro inesperado ao prospectar.");
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) {
      setIsLoadingMore(false);
      searchRequestId.current++;
      return;
    }

    if (window.confirm("Expandir área de busca?")) {
      setIsLoadingMore(true);
      searchRequestId.current++;
      const currentRequestId = searchRequestId.current;
      
      try {
        const currentNames = results.map(r => r.nome);
        const latLng = await getUserLocation();
        const newContacts = await searchBusinesses({
          ...params,
          excludeNames: currentNames
        }, latLng);
        
        if (currentRequestId !== searchRequestId.current) return;
        
        if (newContacts.length > 0) {
           const updatedResults = [...results, ...newContacts];
           setResults(updatedResults);
           onSearchSuccess(params, updatedResults.length);
        } else {
           alert("Nenhum novo lead encontrado nesta expansão.");
        }
      } catch (err: any) {
         if (currentRequestId === searchRequestId.current) {
            alert("Erro ao carregar mais leads.");
         }
      } finally {
         if (currentRequestId === searchRequestId.current) setIsLoadingMore(false);
      }
    }
  };

  return {
    state, params, setParams, results, errorMsg, elapsedTime, isLoadingMore, handleSearch, handleLoadMore
  };
};