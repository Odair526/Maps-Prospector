
import React from 'react';
import { BusinessContact, AppState } from '../../types';
import { ContactCard } from '../../components/ContactCard';
import { Sparkles, Filter, MessageCircle, PhoneOff, Star, ThumbsDown, Search, Hash, PlusCircle, StopCircle } from 'lucide-react';

interface ResultsDashboardProps {
  results: BusinessContact[];
  filteredResults: BusinessContact[];
  filters: any;
  setFilters: (f: any) => void;
  availableDDDs: string[];
  isLoadingMore: boolean;
  onLoadMore: () => void;
  isDarkMode: boolean;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results, filteredResults, filters, setFilters, availableDDDs, isLoadingMore, onLoadMore, isDarkMode
}) => {
  if (results.length === 0) return null;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 pb-16 flex flex-col items-center">
      <div className="flex flex-col md:flex-row items-center justify-between w-full mb-6 gap-4">
        <div className="flex items-center gap-3">
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <Sparkles className="w-5 h-5" />
           </div>
           <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Empresas Encontradas</h3>
           <span className={`text-sm font-bold px-3 py-1 rounded-full ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-gray-800 text-white'}`}>
             {filteredResults.length} / {results.length}
           </span>
        </div>
        <div className={`h-px flex-grow bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-8 hidden md:block ${isDarkMode ? 'via-slate-600' : ''}`}></div>
      </div>

      <div className={`w-full mb-8 p-4 rounded-2xl border backdrop-blur-md transition-colors space-y-4 ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white/90 border-gray-200 shadow-sm'}`}>
        <div className="flex items-center gap-2 mb-2 text-sm font-bold uppercase text-gray-500"><Filter className="w-4 h-4" /> Filtros Locais</div>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4">
             <div className="flex flex-wrap gap-2 items-center">
               <span className="text-xs font-semibold uppercase text-gray-500">WhatsApp:</span>
               {['all', 'with_whatsapp', 'no_whatsapp'].map(mode => (
                 <button key={mode} onClick={() => setFilters({...filters, whatsappMode: mode})} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filters.whatsappMode === mode ? (isDarkMode ? 'bg-blue-900/50 text-blue-300 border border-blue-800' : 'bg-blue-100 text-blue-700 border border-blue-200') : (isDarkMode ? 'bg-slate-700 text-gray-400' : 'bg-white border border-gray-200 text-gray-600')}`}>
                   {mode === 'all' ? 'Todos' : mode === 'with_whatsapp' ? 'Com Zap' : 'Sem Zap'}
                 </button>
               ))}
             </div>
             <div className="flex flex-wrap gap-2 items-center">
               <span className="text-xs font-semibold uppercase text-gray-500">Avaliação:</span>
               {['all', 'positive', 'negative'].map(mode => (
                 <button key={mode} onClick={() => setFilters({...filters, ratingMode: mode})} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filters.ratingMode === mode ? (isDarkMode ? 'bg-blue-900/50 text-blue-300 border border-blue-800' : 'bg-blue-100 text-blue-700 border border-blue-200') : (isDarkMode ? 'bg-slate-700 text-gray-400' : 'bg-white border border-gray-200 text-gray-600')}`}>
                   {mode === 'all' ? 'Todas' : mode === 'positive' ? '+4.0' : 'Baixa'}
                 </button>
               ))}
             </div>
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase mb-2 text-gray-500">Filtrar por DDD:</div>
            <div className="flex flex-wrap gap-2">
               <button onClick={() => setFilters({...filters, selectedDDD: null})} className={`px-2 py-1 text-xs font-bold rounded-md border ${!filters.selectedDDD ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-400'}`}>Todos</button>
               {availableDDDs.map(ddd => (
                 <button key={ddd} onClick={() => setFilters({...filters, selectedDDD: filters.selectedDDD === ddd ? null : ddd})} className={`px-2 py-1 text-xs font-bold rounded-md border ${filters.selectedDDD === ddd ? 'bg-blue-600 text-white' : 'bg-slate-700 text-gray-400'}`}>{ddd}</button>
               ))}
            </div>
          </div>
          <div className="flex-1 space-y-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Nome..." value={filters.name} onChange={(e) => setFilters({...filters, name: e.target.value})} className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none ${isDarkMode ? 'bg-slate-900/50 border-slate-600 text-gray-200' : 'bg-white border-gray-300'}`} />
             </div>
             <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="number" placeholder="Mín. Avaliações" value={filters.minReviews} onChange={(e) => setFilters({...filters, minReviews: e.target.value})} className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border outline-none ${isDarkMode ? 'bg-slate-900/50 border-slate-600 text-gray-200' : 'bg-white border-gray-300'}`} />
             </div>
          </div>
        </div>
      </div>

      {filteredResults.length === 0 ? (
         <div className="text-center py-12 opacity-50"><Filter className="w-12 h-12 mx-auto mb-3" /><p>Nenhuma empresa corresponde aos filtros.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-12">
          {filteredResults.map((contact, index) => (
            <ContactCard key={contact.nome} contact={contact} index={index} />
          ))}
        </div>
      )}

      <button onClick={onLoadMore} className={`flex items-center gap-3 px-8 py-3 font-bold rounded-2xl border transition-all ${isLoadingMore ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-slate-800 text-blue-400 border-slate-700 hover:bg-slate-700'}`}>
        {isLoadingMore ? <><StopCircle className="w-5 h-5 animate-pulse" /><span>Cancelar</span></> : <><PlusCircle className="w-5 h-5" /><span>Buscar Mais</span></>}
      </button>
    </div>
  );
};
