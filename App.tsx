
import React, { useState } from 'react';
import { SearchParams, AppState, SearchHistoryItem } from './types';
import { LoginPage } from './components/LoginPage';
import { ProfileModal } from './components/ProfileModal';
import { useAuth } from './contexts/AuthContext';
import { useSearch } from './hooks/useSearch';
import { useHistory } from './hooks/useHistory';
import { useResultsFilter } from './hooks/useResultsFilter';
import { useTheme } from './hooks/useTheme';
import { Navbar } from './features/Header/Navbar';
import { SearchHero } from './features/Search/SearchHero';
import { ResultsDashboard } from './features/Results/ResultsDashboard';
import { HistoryDrawer } from './features/History/HistoryDrawer';
import { XCircle } from 'lucide-react';

export default function App() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isDarkMode, setIsDarkMode } = useTheme();
  
  // History Hook
  const { 
    searchHistory, showHistory, setShowHistory, addToHistory, deleteHistoryItem, clearHistory 
  } = useHistory(user);

  // Search Hook
  const {
    state, params, setParams, results, errorMsg, elapsedTime, isLoadingMore, handleSearch, handleLoadMore
  } = useSearch(addToHistory);

  // Filter Hook
  const { 
    filters, setFilters, filteredResults, availableDDDs 
  } = useResultsFilter(results);

  // UI States
  const [showProfileModal, setShowProfileModal] = useState(false);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-slate-950 flex items-center justify-center">
         <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-gray-500 dark:text-gray-400 font-medium">Carregando...</p>
         </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const handleExport = () => {
    if (filteredResults.length === 0) return;
    const BOM = "\uFEFF";
    const headers = ['Nome', 'Telefone', 'WhatsApp', 'Email', 'Website', 'Instagram', 'Facebook', 'LinkedIn', 'Endereço', 'Link Maps', 'Avaliação', 'Num. Avaliações', 'Resumo Web'];
    const csvRows = [
      headers.join(','),
      ...filteredResults.map(row => [
        `"${row.nome}"`, `"${row.telefone}"`, `"${row.whatsapp ? 'Sim' : 'Não'}"`, `"${row.email}"`, `"${row.website}"`, `"${row.instagram}"`, `"${row.facebook}"`, `"${row.linkedin || ''}"`, `"${row.endereco}"`, `"${row.link_maps}"`, `"${row.rating || 0}"`, `"${row.reviewCount || 0}"`, `"${row.web_summary || ''}"`
      ].join(','))
    ];
    const csvContent = "data:text/csv;charset=utf-8," + BOM + encodeURIComponent(csvRows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `prospects_${params.niche}_${params.location}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const restoreHistoryItem = (item: SearchHistoryItem) => {
    setParams(item.params);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-blue-50 text-gray-900'}`}>
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className={`absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] rounded-full blur-[100px] opacity-40 animate-pulse ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-300/20'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[35rem] h-[35rem] rounded-full blur-[100px] opacity-40 animate-pulse delay-1000 ${isDarkMode ? 'bg-cyan-900/20' : 'bg-cyan-300/20'}`} />
        <div className={`absolute inset-0 ${isDarkMode ? 'opacity-10' : 'opacity-[0.03]'}`} style={{ backgroundImage: `radial-gradient(${isDarkMode ? '#475569' : '#0f172a'} 1px, transparent 1px)`, backgroundSize: '30px 30px' }}></div>
      </div>

      <Navbar 
        user={user} 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode} 
        onShowHistory={() => setShowHistory(true)}
        onExport={handleExport}
        hasResults={results.length > 0}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      <HistoryDrawer 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        items={searchHistory} 
        onRestore={restoreHistoryItem}
        onDelete={deleteHistoryItem}
        onClear={clearHistory}
        isDarkMode={isDarkMode}
      />

      <main className="relative z-10 flex-grow flex flex-col items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SearchHero 
          state={isLoadingMore ? AppState.SEARCHING : state} 
          params={params} 
          setParams={setParams} 
          onSearch={handleSearch} 
          elapsedTime={elapsedTime}
          isDarkMode={isDarkMode}
        />

        {state === AppState.ERROR && (
          <div className={`w-full max-w-2xl backdrop-blur p-6 rounded-2xl border text-center mb-12 shadow-lg animate-in fade-in ${isDarkMode ? 'bg-red-900/30 border-red-900/50 text-red-300' : 'bg-red-50/90 border-red-100 text-red-600'}`}>
            <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        <ResultsDashboard 
          results={results} 
          filteredResults={filteredResults} 
          filters={filters} 
          setFilters={setFilters} 
          availableDDDs={availableDDDs}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          isDarkMode={isDarkMode}
        />

        {state === AppState.IDLE && (
          <div className="mt-4 text-center opacity-40 max-w-md mx-auto">
             <div className={`w-16 h-1 rounded-full mx-auto mb-4 ${isDarkMode ? 'bg-blue-700' : 'bg-blue-300'}`}></div>
             <p className="text-sm">Configure sua busca para começar a prospectar.</p>
          </div>
        )}
      </main>
    </div>
  );
}