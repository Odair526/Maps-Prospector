
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BusinessContact, SearchParams, AppState, SearchHistoryItem } from './types';
import { searchBusinesses } from './services/geminiService';
import { RobotMascot } from './components/RobotMascot';
import { ContactCard } from './components/ContactCard';
import { LoginPage } from './components/LoginPage';
import { ProfileModal } from './components/ProfileModal';
import { useAuth } from './contexts/AuthContext';
import { Search, Download, MapPin, Briefcase, Target, Navigation, MessageCircle, XCircle, Sparkles, History, Trash2, RotateCcw, X, Clock, LogOut, User as UserIcon, PlusCircle, Loader2, Zap, StopCircle, Globe, Instagram, Facebook, Linkedin, Check, Moon, Sun, Filter, Hash, Star, ThumbsUp, ThumbsDown, Phone, PhoneOff } from 'lucide-react';

export default function App() {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  
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
  
  // Search Timer
  const [elapsedTime, setElapsedTime] = useState(0);

  // History State
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Profile Menu Dropdown State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Load More State
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('prospector_theme') === 'dark';
    }
    return false;
  });

  // Result Filters State
  const [resultFilters, setResultFilters] = useState({
    name: '',
    selectedDDD: null as string | null,
    whatsappMode: 'all', // 'all', 'with_whatsapp', 'no_whatsapp'
    ratingMode: 'all', // 'all', 'positive', 'negative'
    minReviews: ''
  });

  // Ref to track the current request ID for cancellation
  const searchRequestId = useRef(0);

  // Load history from local storage on mount
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

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('prospector_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('prospector_theme', 'light');
    }
  }, [isDarkMode]);

  // Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (state === AppState.SEARCHING || isLoadingMore) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      // If we just finished a search (RESULTS or ERROR), don't reset immediately so user sees time.
      // Reset only when going back to IDLE or starting new search handled in handleSearch
    }
    return () => clearInterval(interval);
  }, [state, isLoadingMore]);

  // Extract available DDDs from results
  const availableDDDs = useMemo(() => {
    const ddds = new Set<string>();
    results.forEach(contact => {
      const phone = contact.telefone || ''; // Safety check
      const digits = phone.replace(/\D/g, '');
      if (digits.length >= 2) {
        ddds.add(digits.substring(0, 2));
      }
    });
    return Array.from(ddds).sort();
  }, [results]);

  // Filter Logic
  const filteredResults = useMemo(() => {
    return results.filter(contact => {
      // 1. Name Filter (Case Insensitive)
      if (resultFilters.name && !contact.nome.toLowerCase().includes(resultFilters.name.toLowerCase())) {
        return false;
      }

      // 2. DDD Filter (Button Selection)
      if (resultFilters.selectedDDD) {
        const phone = contact.telefone || ''; // Safety check
        const cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone.startsWith(resultFilters.selectedDDD)) {
          return false;
        }
      }

      // 3. WhatsApp Filter
      if (resultFilters.whatsappMode === 'with_whatsapp' && !contact.whatsapp) return false;
      if (resultFilters.whatsappMode === 'no_whatsapp' && contact.whatsapp) return false;

      // 4. Rating Filter
      const rating = contact.rating || 0;
      if (resultFilters.ratingMode === 'positive' && rating < 4.0) return false;
      if (resultFilters.ratingMode === 'negative' && rating >= 4.0) return false; // Assuming < 4 is "not positive" or "negative" context
      
      // 5. Min Reviews Filter
      if (resultFilters.minReviews) {
        const min = parseInt(resultFilters.minReviews);
        if (!isNaN(min) && (contact.reviewCount || 0) < min) {
          return false;
        }
      }

      return true;
    });
  }, [results, resultFilters]);


  // Handle Authentication State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-300">
         <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-gray-500 dark:text-gray-400 font-medium">Carregando sistema...</p>
         </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Format Timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to save history to state and local storage
  const addToHistory = (searchParams: SearchParams, count: number) => {
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      params: { ...searchParams }, // Copy params to avoid ref issues
      resultCount: count
    };

    const newHistory = [newItem, ...searchHistory].slice(0, 50); // Keep last 50
    setSearchHistory(newHistory);
    localStorage.setItem('prospector_history', JSON.stringify(newHistory));
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(item => item.id !== id);
    setSearchHistory(newHistory);
    localStorage.setItem('prospector_history', JSON.stringify(newHistory));
  };

  const restoreHistoryItem = (item: SearchHistoryItem) => {
    setParams(item.params);
    setShowHistory(false);
    // Optional: scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    if (window.confirm("Deseja realmente limpar todo o histórico?")) {
      setSearchHistory([]);
      localStorage.removeItem('prospector_history');
    }
  };

  // Helper to safely extract error message
  const getErrorMessage = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object') {
      // Handle potential API error objects
      if (err.message) return String(err.message);
      if (err.error?.message) return String(err.error.message);
      try {
        return JSON.stringify(err);
      } catch {
        return "Erro desconhecido (Objeto não serializável)";
      }
    }
    return String(err);
  };

  const handleSearch = async (e: React.FormEvent | React.MouseEvent, isFastMode: boolean = false) => {
    e.preventDefault();
    if (!params.location || !params.niche) {
      if (e.type === 'click') {
        const form = document.getElementById('search-form') as HTMLFormElement;
        if (form && !form.checkValidity()) {
          form.reportValidity();
          return;
        }
      }
      return;
    }

    setState(AppState.SEARCHING);
    setResults([]); // Clear previous results on new search
    setResultFilters({ name: '', selectedDDD: null, whatsappMode: 'all', ratingMode: 'all', minReviews: '' }); // Reset filters
    setErrorMsg('');
    setElapsedTime(0); // Reset timer
    setIsLoadingMore(false);
    
    // Update params with fast mode
    const searchParams = { ...params, fastMode: isFastMode };
    setParams(searchParams);

    // Increment request ID to invalidate any background load-more processes
    searchRequestId.current++;

    try {
      const data = await searchBusinesses(searchParams);
      setResults(data);
      setState(AppState.RESULTS);
      
      // Save to history on success
      if (data.length > 0) {
        addToHistory(searchParams, data.length);
      }

    } catch (err: any) {
      console.error("Search error:", err);
      setState(AppState.ERROR);
      
      let msg = getErrorMessage(err);
      if (msg === '{}' || msg === '[object Object]') msg = "Ocorreu um erro interno na API. Tente novamente.";
      
      setErrorMsg(msg);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) {
      setIsLoadingMore(false);
      searchRequestId.current++; // Invalidate pending requests
      return;
    }

    // UPDATED: Confirmation now explicitly mentions radius expansion
    if (window.confirm("O sistema irá EXPANDIR O RAIO DE BUSCA para encontrar novas empresas em regiões mais distantes. Deseja continuar?")) {
      setIsLoadingMore(true);
      searchRequestId.current++; // Invalidate previous requests if any
      const currentRequestId = searchRequestId.current;
      
      try {
        const currentNames = results.map(r => r.nome);
        const newContacts = await searchBusinesses({
          ...params,
          excludeNames: currentNames
        });
        
        if (currentRequestId !== searchRequestId.current) return;
        
        if (newContacts.length === 0) {
           alert("Não foram encontrados novos contatos mesmo expandindo a área. Tente uma nova localização.");
        } else {
           setResults(prev => [...prev, ...newContacts]);
           addToHistory(params, results.length + newContacts.length);
        }

      } catch (err: any) {
         if (currentRequestId !== searchRequestId.current) return;
         console.error("Load more error:", err);
         alert("Erro ao carregar mais: " + getErrorMessage(err));
      } finally {
         if (currentRequestId === searchRequestId.current) {
            setIsLoadingMore(false);
         }
      }
    }
  };

  const handleExport = () => {
    // Export filtered results instead of all results
    if (filteredResults.length === 0) return;

    const BOM = "\uFEFF";
    const headers = ['Nome', 'Telefone', 'WhatsApp', 'Email', 'Website', 'Instagram', 'Facebook', 'LinkedIn', 'Endereço', 'Link Maps', 'Avaliação', 'Num. Avaliações', 'Resumo Web'];
    const csvRows = [
      headers.join(','),
      ...filteredResults.map(row => [
        `"${row.nome}"`,
        `"${row.telefone}"`,
        `"${row.whatsapp ? 'Sim' : 'Não'}"`,
        `"${row.email}"`,
        `"${row.website}"`,
        `"${row.instagram}"`,
        `"${row.facebook}"`,
        `"${row.linkedin || ''}"`,
        `"${row.endereco}"`,
        `"${row.link_maps}"`,
        `"${row.rating || 0}"`,
        `"${row.reviewCount || 0}"`,
        `"${row.web_summary || ''}"`
      ].join(','))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + BOM + encodeURIComponent(csvRows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `prospects_${params.niche}_${params.location}_filtered.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tech-themed input classes (Dark Mode Added)
  // UPDATED: High Contrast for Light Mode.
  const inputContainerClasses = "relative group";
  const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-hover:text-gray-800 group-focus-within:text-blue-600 transition-colors dark:text-gray-400 dark:group-focus-within:text-blue-500";
  const inputClasses = "w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm font-medium dark:bg-slate-800/50 dark:border-slate-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-slate-800 dark:focus:border-blue-500/50";
  const labelClasses = "block text-xs font-bold text-gray-900 mb-1.5 ml-1 uppercase tracking-widest dark:text-gray-400";

  return (
    <div className={`min-h-screen relative overflow-hidden selection:bg-blue-500 selection:text-white font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* Profile Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className={`absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full blur-[100px] opacity-40 animate-pulse ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-400/20'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[35rem] h-[35rem] rounded-full blur-[100px] opacity-40 animate-pulse delay-1000 ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-400/20'}`} />
        <div className={`absolute top-[40%] left-[20%] w-[20rem] h-[20rem] rounded-full blur-[80px] opacity-30 ${isDarkMode ? 'bg-cyan-900/20' : 'bg-cyan-300/10'}`} />
        {/* Grid Pattern Overlay */}
        <div className={`absolute inset-0 ${isDarkMode ? 'opacity-10' : 'opacity-30'}`} style={{ backgroundImage: `radial-gradient(${isDarkMode ? '#475569' : '#cbd5e1'} 1px, transparent 1px)`, backgroundSize: '30px 30px' }}></div>
      </div>

      {/* Header / Navbar */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/70 border-slate-700/50' : 'bg-white/70 border-white/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-default">
             <div className="relative w-10 h-10">
               <div className="absolute inset-0 bg-blue-600 rounded-lg rotate-3 group-hover:rotate-12 transition-transform opacity-20"></div>
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold shadow-lg group-hover:-translate-y-1 transition-transform">
                 M
               </div>
             </div>
             <div>
               <h1 className={`text-xl font-bold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Maps <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">Prospector</span></h1>
               <p className="text-[10px] font-medium text-gray-400 tracking-wider uppercase">AI Powered Agent</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
               onClick={() => setIsDarkMode(!isDarkMode)}
               className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-white/50 text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
               title={isDarkMode ? "Modo Claro" : "Modo Noturno"}
            >
               {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* History Toggle Button */}
            <button 
              onClick={() => setShowHistory(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border font-medium text-sm ${isDarkMode ? 'text-gray-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700' : 'text-gray-600 hover:text-blue-600 bg-white/50 hover:bg-blue-50 border-transparent hover:border-blue-100'}`}
              title="Histórico de Pesquisa"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </button>

            {results.length > 0 && (
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            )}

            {/* User Profile Dropdown / Area */}
            <div className={`flex items-center gap-3 pl-3 border-l ml-1 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
               <div className="flex flex-col items-end hidden md:flex">
                 <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{user.name}</span>
                 <span className="text-[10px] text-gray-400">Plano Pro</span>
               </div>
               
               <div className="relative">
                 <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="focus:outline-none"
                    title="Menu do Usuário"
                 >
                   <img 
                     src={user.photoUrl} 
                     alt={user.name} 
                     className={`w-9 h-9 rounded-full border-2 shadow-sm cursor-pointer object-cover transition-colors ${isDarkMode ? 'border-slate-600 hover:border-blue-400' : 'border-white hover:border-blue-200'}`}
                   />
                 </button>
                 
                 {/* Clickable Dropdown Menu */}
                 {isProfileMenuOpen && (
                   <>
                     <div 
                        className="fixed inset-0 z-40 cursor-default" 
                        onClick={() => setIsProfileMenuOpen(false)}
                     ></div>
                     
                     <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border p-1 animate-in fade-in slide-in-from-top-1 z-50 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                        <button 
                          onClick={() => {
                            setShowProfileModal(true);
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors mb-1 ${isDarkMode ? 'text-gray-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <UserIcon className="w-4 h-4" /> Meu Perfil
                        </button>
                        <div className={`h-px my-1 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}></div>
                        <button 
                          onClick={() => {
                            logout();
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${isDarkMode ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-red-50'}`}
                        >
                          <LogOut className="w-4 h-4" /> Sair
                        </button>
                     </div>
                   </>
                 )}
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* History Sidebar / Drawer */}
      <div className={`fixed inset-0 z-50 transform transition-all duration-500 ease-in-out ${showHistory ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setShowHistory(false)} style={{ opacity: showHistory ? 1 : 0 }}></div>
        <div className={`absolute top-0 right-0 h-full w-full max-w-sm backdrop-blur-2xl shadow-2xl border-l flex flex-col transform transition-transform duration-500 ${isDarkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-white/50'}`}>
           <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
             <div className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold">Histórico Recente</h3>
             </div>
             <button onClick={() => setShowHistory(false)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="w-5 h-5" />
             </button>
           </div>
           
           <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {searchHistory.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <Clock className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-slate-700' : 'text-gray-300'}`} />
                  <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Nenhuma pesquisa recente.</p>
                </div>
              ) : (
                searchHistory.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => restoreHistoryItem(item)}
                    className={`group relative border rounded-xl p-4 cursor-pointer transition-all duration-200 ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <h4 className={`font-bold line-clamp-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.params.niche}</h4>
                       <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${isDarkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                         {new Date(item.timestamp).toLocaleDateString()}
                       </span>
                    </div>
                    <div className={`text-xs flex flex-col gap-1 mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.params.location}</span>
                       <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {item.resultCount} contatos encontrados</span>
                    </div>
                    
                    <div className={`flex items-center justify-between mt-2 pt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-50'}`}>
                       <span className="text-xs font-medium text-blue-600 flex items-center gap-1 group-hover:underline">
                         <RotateCcw className="w-3 h-3" /> Restaurar Busca
                       </span>
                       <button 
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className={`p-1.5 rounded-lg transition-colors z-10 ${isDarkMode ? 'text-gray-500 hover:text-red-400 hover:bg-slate-700' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                          title="Excluir"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ))
              )}
           </div>
           
           {searchHistory.length > 0 && (
             <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-100 bg-gray-50/50'}`}>
                <button 
                  onClick={clearHistory}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${isDarkMode ? 'text-red-400 hover:bg-slate-800' : 'text-red-600 hover:bg-red-50'}`}
                >
                   <Trash2 className="w-4 h-4" /> Limpar Histórico Completo
                </button>
             </div>
           )}
        </div>
      </div>

      <main className="relative z-10 flex-grow flex flex-col items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero / Input Section */}
        <div className="w-full max-w-4xl mx-auto mb-16">
          <div className="flex flex-col items-center mb-10">
            <div className="scale-110 mb-4">
              <RobotMascot state={isLoadingMore ? 'SEARCHING' : state} />
            </div>
            
            {/* Timer Display */}
            {((state === AppState.SEARCHING || isLoadingMore) || (elapsedTime > 0 && state !== AppState.IDLE)) && (
              <div className={`mb-4 backdrop-blur border rounded-full px-4 py-1 text-sm font-mono flex items-center gap-2 shadow-sm animate-in fade-in ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-gray-300' : 'bg-white/50 border-gray-200 text-gray-600'}`}>
                 <Clock className={`w-3.5 h-3.5 ${state === AppState.SEARCHING || isLoadingMore ? 'animate-pulse text-blue-500' : ''}`} />
                 <span>Tempo: {formatTime(elapsedTime)}</span>
              </div>
            )}

            <h2 className={`text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r text-center tracking-tight mb-4 ${isDarkMode ? 'from-white via-blue-200 to-white' : 'from-gray-900 via-blue-800 to-gray-900'}`}>
              Prospecção Inteligente
            </h2>
            <p className={`text-center max-w-lg text-lg leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Localize empresas, filtre contatos qualificados e exporte leads diretamente do Google Maps com inteligência artificial.
            </p>
          </div>

          <div className={`backdrop-blur-xl rounded-3xl shadow-2xl border p-8 relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/80 shadow-blue-900/10 border-slate-700' : 'bg-white/80 shadow-blue-900/5 border-white'}`}>
            {/* Decorative top gradient line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500"></div>

            <form id="search-form" onSubmit={(e) => handleSearch(e, false)} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={inputContainerClasses}>
                  <label className={labelClasses}>Localização</label>
                  <div className="relative">
                    <MapPin className={iconClasses} />
                    <input
                      type="text"
                      placeholder="Ex: São Paulo, SP ou Brasil"
                      value={params.location}
                      onChange={(e) => setParams({ ...params, location: e.target.value })}
                      className={inputClasses}
                      required
                    />
                  </div>
                </div>

                <div className={inputContainerClasses}>
                  <label className={labelClasses}>Raio de Busca</label>
                  <div className="relative">
                    <Navigation className={iconClasses} />
                    <input
                      type="text"
                      placeholder="Ex: 5km (ou deixe vazio para Estado/País)"
                      value={params.radius}
                      onChange={(e) => setParams({ ...params, radius: e.target.value })}
                      className={inputClasses}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={inputContainerClasses}>
                  <label className={labelClasses}>Nicho de Mercado</label>
                  <div className="relative">
                    <Briefcase className={iconClasses} />
                    <input
                      type="text"
                      placeholder="Ex: Odontologia, Pizzaria"
                      value={params.niche}
                      onChange={(e) => setParams({ ...params, niche: e.target.value })}
                      className={inputClasses}
                      required
                    />
                  </div>
                </div>

                <div className={inputContainerClasses}>
                  <label className={labelClasses}>Tipo de Empresa</label>
                  <div className="relative">
                    <Target className={iconClasses} />
                    <input
                      type="text"
                      placeholder="Ex: Clínicas, Atacado"
                      value={params.type}
                      onChange={(e) => setParams({ ...params, type: e.target.value })}
                      className={inputClasses}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Filters Section */}
              <div className={`space-y-6 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <div className="flex flex-col gap-4">
                  
                  {/* WhatsApp Filter */}
                  <button
                    type="button"
                    onClick={() => setParams({...params, whatsappOnly: !params.whatsappOnly})}
                    className={`inline-flex items-center cursor-pointer group p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 w-full md:w-auto select-none active:scale-95 hover:scale-[1.02] ${isDarkMode ? 'hover:bg-slate-800 focus:ring-blue-900' : 'hover:bg-gray-50 focus:ring-green-100'}`}
                  >
                    <div className="relative">
                      <div className={`w-11 h-6 rounded-full transition-all duration-300 ${params.whatsappOnly ? 'bg-green-500' : (isDarkMode ? 'bg-slate-700' : 'bg-gray-200')}`}></div>
                      <div className={`absolute top-1 left-1 bg-white border w-4 h-4 rounded-full transition-all duration-300 shadow-sm ${params.whatsappOnly ? 'translate-x-5 border-green-600' : 'translate-x-0 border-gray-300'}`}></div>
                    </div>
                    <span className={`ml-3 text-sm font-semibold flex items-center gap-2 transition-colors ${isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                      <MessageCircle className={`w-4 h-4 ${params.whatsappOnly ? 'text-green-500' : 'text-gray-400'}`} />
                      Apenas com WhatsApp
                    </span>
                  </button>

                  {/* Prospecção Profunda */}
                  <div className="mt-2">
                    <label className={labelClasses}>Prospecção Profunda (Redes Sociais)</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {/* Website Toggle */}
                       <button
                         type="button"
                         onClick={() => setParams({...params, deepSearchWeb: !params.deepSearchWeb})}
                         className={`flex items-center justify-between p-3 rounded-xl border transition-all active:scale-95 hover:scale-[1.02] select-none 
                            ${params.deepSearchWeb 
                                ? (isDarkMode ? 'bg-blue-900/30 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-800 shadow-sm') 
                                : (isDarkMode ? 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50')}`}
                       >
                         <div className="flex items-center gap-2">
                           <Globe className={`w-4 h-4 ${params.deepSearchWeb ? 'text-blue-600' : 'text-gray-400'}`} />
                           <span className="text-sm font-semibold">Site</span>
                         </div>
                         <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${params.deepSearchWeb ? 'bg-blue-600 border-blue-600' : (isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300')}`}>
                           {params.deepSearchWeb && <Check className="w-3 h-3 text-white" />}
                         </div>
                       </button>

                       {/* Instagram Toggle */}
                       <button
                         type="button"
                         onClick={() => setParams({...params, deepSearchInstagram: !params.deepSearchInstagram})}
                         className={`flex items-center justify-between p-3 rounded-xl border transition-all active:scale-95 hover:scale-[1.02] select-none 
                            ${params.deepSearchInstagram 
                                ? (isDarkMode ? 'bg-pink-900/30 border-pink-700 text-pink-300' : 'bg-pink-50 border-pink-300 text-pink-700 shadow-sm')
                                : (isDarkMode ? 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50')}`}
                       >
                         <div className="flex items-center gap-2">
                           <Instagram className={`w-4 h-4 ${params.deepSearchInstagram ? 'text-pink-600' : 'text-gray-400'}`} />
                           <span className="text-sm font-semibold">Instagram</span>
                         </div>
                         <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${params.deepSearchInstagram ? 'bg-pink-600 border-pink-600' : (isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300')}`}>
                           {params.deepSearchInstagram && <Check className="w-3 h-3 text-white" />}
                         </div>
                       </button>

                       {/* Facebook Toggle */}
                       <button
                         type="button"
                         onClick={() => setParams({...params, deepSearchFacebook: !params.deepSearchFacebook})}
                         className={`flex items-center justify-between p-3 rounded-xl border transition-all active:scale-95 hover:scale-[1.02] select-none 
                            ${params.deepSearchFacebook 
                                ? (isDarkMode ? 'bg-blue-900/30 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-800 shadow-sm')
                                : (isDarkMode ? 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50')}`}
                       >
                         <div className="flex items-center gap-2">
                           <Facebook className={`w-4 h-4 ${params.deepSearchFacebook ? (isDarkMode ? 'text-blue-400' : 'text-blue-700') : 'text-gray-400'}`} />
                           <span className="text-sm font-semibold">Facebook</span>
                         </div>
                         <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${params.deepSearchFacebook ? 'bg-blue-700 border-blue-700' : (isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300')}`}>
                           {params.deepSearchFacebook && <Check className="w-3 h-3 text-white" />}
                         </div>
                       </button>

                       {/* LinkedIn Toggle */}
                       <button
                         type="button"
                         onClick={() => setParams({...params, deepSearchLinkedin: !params.deepSearchLinkedin})}
                         className={`flex items-center justify-between p-3 rounded-xl border transition-all active:scale-95 hover:scale-[1.02] select-none 
                            ${params.deepSearchLinkedin 
                                ? (isDarkMode ? 'bg-blue-900/30 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm')
                                : (isDarkMode ? 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50')}`}
                       >
                         <div className="flex items-center gap-2">
                           <Linkedin className={`w-4 h-4 ${params.deepSearchLinkedin ? 'text-blue-600' : 'text-gray-400'}`} />
                           <span className="text-sm font-semibold">LinkedIn</span>
                         </div>
                         <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${params.deepSearchLinkedin ? 'bg-blue-700 border-blue-700' : (isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300')}`}>
                           {params.deepSearchLinkedin && <Check className="w-3 h-3 text-white" />}
                         </div>
                       </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="button"
                  onClick={(e) => handleSearch(e, true)}
                  disabled={state === AppState.SEARCHING || isLoadingMore}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-lg transition-all shadow-sm active:translate-y-0.5 transform duration-200 group ${
                    (state === AppState.SEARCHING || isLoadingMore)
                      ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' 
                      : (isDarkMode ? 'bg-amber-900/40 text-amber-400 border border-amber-900/50 hover:bg-amber-900/60' : 'text-amber-700 bg-amber-100 hover:bg-amber-200 hover:shadow-md')
                  }`}
                  title="Usa o modelo Flash-Lite para maior velocidade"
                >
                   {state === AppState.SEARCHING && params.fastMode ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                   ) : (
                      <Zap className={`w-5 h-5 ${isDarkMode ? 'fill-amber-400' : 'fill-amber-700'}`} />
                   )}
                   <span>Prospecção Rápida</span>
                </button>

                <button
                  type="submit"
                  disabled={state === AppState.SEARCHING || isLoadingMore}
                  className={`flex-[2] flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-white font-bold text-lg transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 transform duration-200 relative overflow-hidden group ${
                    (state === AppState.SEARCHING || isLoadingMore)
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none dark:bg-slate-700 dark:text-slate-400' 
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-blue-500/30'
                  }`}
                >
                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-scan pointer-events-none"></div>

                  {state === AppState.SEARCHING && !params.fastMode ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processando Busca...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Iniciar Prospecção</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Error State */}
        {state === AppState.ERROR && (
          <div className={`w-full max-w-2xl backdrop-blur p-6 rounded-2xl border text-center mb-12 shadow-lg animate-in fade-in slide-in-from-bottom-2 ${isDarkMode ? 'bg-red-900/30 border-red-900/50 text-red-300' : 'bg-red-50/80 border-red-100 text-red-600'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
               <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 pb-16 flex flex-col items-center">
            
            <div className="flex flex-col md:flex-row items-center justify-between w-full mb-6 gap-4">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <Sparkles className="w-5 h-5" />
                 </div>
                 <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    Empresas Encontradas
                 </h3>
                 <span className={`text-sm font-bold px-3 py-1 rounded-full shadow-lg ${isDarkMode ? 'bg-slate-700 text-white shadow-black/20' : 'bg-gray-900 text-white shadow-gray-500/20'}`}>
                   {filteredResults.length} / {results.length}
                 </span>
              </div>
              
              <div className={`h-px flex-grow bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-8 hidden md:block ${isDarkMode ? 'via-slate-600' : ''}`}></div>
            </div>

            {/* Local Filters Toolbar */}
            <div className={`w-full mb-8 p-4 rounded-2xl border backdrop-blur-md transition-colors space-y-4 ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white/70 border-white/50 shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <Filter className="w-4 h-4" /> Filtros Locais
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Section 1: Buttons/Toggles */}
                <div className="flex-1 space-y-4">
                   {/* WhatsApp Filter Buttons */}
                   <div className="flex flex-wrap gap-2 items-center">
                     <span className={`text-xs font-semibold uppercase mr-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>WhatsApp:</span>
                     <div className="flex gap-2">
                        <button 
                          onClick={() => setResultFilters({...resultFilters, whatsappMode: 'all'})}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${resultFilters.whatsappMode === 'all' ? (isDarkMode ? 'bg-blue-900/50 text-blue-300 border border-blue-800' : 'bg-blue-100 text-blue-700 border border-blue-200') : (isDarkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}`}
                        >
                          Todos
                        </button>
                        <button 
                          onClick={() => setResultFilters({...resultFilters, whatsappMode: 'with_whatsapp'})}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5 ${resultFilters.whatsappMode === 'with_whatsapp' ? (isDarkMode ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-green-100 text-green-700 border border-green-200') : (isDarkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}`}
                        >
                          <MessageCircle className="w-3 h-3" /> Com Zap
                        </button>
                        <button 
                          onClick={() => setResultFilters({...resultFilters, whatsappMode: 'no_whatsapp'})}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5 ${resultFilters.whatsappMode === 'no_whatsapp' ? (isDarkMode ? 'bg-red-900/50 text-red-400 border border-red-800' : 'bg-red-100 text-red-700 border border-red-200') : (isDarkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}`}
                        >
                          <PhoneOff className="w-3 h-3" /> Sem Zap
                        </button>
                     </div>
                   </div>

                   {/* Ratings Filter Buttons */}
                   <div className="flex flex-wrap gap-2 items-center">
                     <span className={`text-xs font-semibold uppercase mr-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Avaliação:</span>
                     <div className="flex gap-2">
                        <button 
                           onClick={() => setResultFilters({...resultFilters, ratingMode: 'all'})}
                           className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 ${resultFilters.ratingMode === 'all' ? (isDarkMode ? 'bg-blue-900/50 text-blue-300 border border-blue-800' : 'bg-blue-100 text-blue-700 border border-blue-200') : (isDarkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}`}
                         >
                           Todas
                         </button>
                         <button 
                           onClick={() => setResultFilters({...resultFilters, ratingMode: 'positive'})}
                           className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5 ${resultFilters.ratingMode === 'positive' ? (isDarkMode ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800' : 'bg-yellow-100 text-yellow-700 border border-yellow-200') : (isDarkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}`}
                         >
                           <Star className="w-3 h-3 fill-current" /> +4.0
                         </button>
                         <button 
                           onClick={() => setResultFilters({...resultFilters, ratingMode: 'negative'})}
                           className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5 ${resultFilters.ratingMode === 'negative' ? (isDarkMode ? 'bg-orange-900/50 text-orange-400 border border-orange-800' : 'bg-orange-100 text-orange-700 border border-orange-200') : (isDarkMode ? 'bg-slate-700 text-gray-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}`}
                         >
                           <ThumbsDown className="w-3 h-3" /> Baixa
                         </button>
                     </div>
                   </div>
                </div>

                {/* Section 2: DDD Chips */}
                <div className="flex-1">
                  <div className={`text-xs font-semibold uppercase mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Filtrar por DDD:</div>
                  <div className="flex flex-wrap gap-2">
                     <button
                        onClick={() => setResultFilters({...resultFilters, selectedDDD: null})}
                        className={`px-2 py-1 text-xs font-bold rounded-md border transition-all ${!resultFilters.selectedDDD ? (isDarkMode ? 'bg-blue-600 text-white border-blue-500' : 'bg-blue-600 text-white border-blue-600') : (isDarkMode ? 'bg-slate-700 text-gray-400 border-transparent hover:border-slate-500' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')}`}
                     >
                       Todos
                     </button>
                     {availableDDDs.map(ddd => (
                       <button
                         key={ddd}
                         onClick={() => setResultFilters({...resultFilters, selectedDDD: resultFilters.selectedDDD === ddd ? null : ddd})}
                         className={`px-2 py-1 text-xs font-bold rounded-md border transition-all ${resultFilters.selectedDDD === ddd ? (isDarkMode ? 'bg-blue-600 text-white border-blue-500' : 'bg-blue-600 text-white border-blue-600') : (isDarkMode ? 'bg-slate-700 text-gray-400 border-transparent hover:border-slate-500' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300')}`}
                       >
                         {ddd}
                       </button>
                     ))}
                     {availableDDDs.length === 0 && (
                       <span className={`text-xs italic ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>Nenhum DDD detectado</span>
                     )}
                  </div>
                </div>

                {/* Section 3: Text Inputs */}
                <div className="flex-1 space-y-3 min-w-[200px]">
                   {/* Name Filter */}
                   <div className="relative">
                      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input 
                        type="text" 
                        placeholder="Buscar por nome..." 
                        value={resultFilters.name}
                        onChange={(e) => setResultFilters({...resultFilters, name: e.target.value})}
                        className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-600 text-gray-200 placeholder-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-700 placeholder-gray-500 focus:border-blue-400'}`}
                      />
                   </div>
                   
                   {/* Review Count Filter */}
                   <div className="relative">
                      <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <input 
                        type="number" 
                        placeholder="Mín. Avaliações" 
                        value={resultFilters.minReviews}
                        onChange={(e) => setResultFilters({...resultFilters, minReviews: e.target.value})}
                        className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none transition-all ${isDarkMode ? 'bg-slate-900/50 border-slate-600 text-gray-200 placeholder-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-700 placeholder-gray-500 focus:border-blue-400'}`}
                      />
                   </div>
                </div>

              </div>
            </div>

            {filteredResults.length === 0 ? (
               <div className="text-center py-12 opacity-50">
                  <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">Nenhuma empresa corresponde aos filtros selecionados.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12">
                {filteredResults.map((contact, index) => (
                  <ContactCard key={`${index}-${contact.nome}`} contact={contact} index={index} />
                ))}
              </div>
            )}

            {/* Load More Button */}
            <button
               onClick={handleLoadMore}
               className={`group flex items-center gap-3 px-8 py-3 font-bold rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 ${
                 isLoadingMore 
                   ? (isDarkMode ? 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/30' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100')
                   : (isDarkMode ? 'bg-slate-800 text-blue-400 border-slate-700 hover:bg-slate-700' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50')
               }`}
            >
              {isLoadingMore ? (
                <>
                  <StopCircle className="w-5 h-5 animate-pulse" />
                  <span>Cancelar Busca</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Buscar Mais Resultados</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Empty State / Welcome */}
        {state === AppState.IDLE && (
          <div className="mt-4 text-center opacity-40 max-w-md mx-auto">
             <div className={`w-16 h-1 rounded-full mx-auto mb-4 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`}></div>
             <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>O sistema utiliza IA avançada para varrer o Google Maps em tempo real. Configure sua busca para começar.</p>
          </div>
        )}
      </main>
    </div>
  );
}
