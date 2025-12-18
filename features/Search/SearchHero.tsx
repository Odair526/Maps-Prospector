
import React from 'react';
import { RobotMascot } from '../../components/RobotMascot';
import { SearchParams, AppState } from '../../types';
import { MapPin, Navigation, Briefcase, Target, MessageCircle, Globe, Instagram, Facebook, Linkedin, Check, Zap, Search, Clock, Loader2 } from 'lucide-react';

interface SearchHeroProps {
  state: AppState;
  params: SearchParams;
  setParams: (p: SearchParams) => void;
  onSearch: (e: React.FormEvent | React.MouseEvent, fast: boolean) => void;
  elapsedTime: number;
  isDarkMode: boolean;
}

export const SearchHero: React.FC<SearchHeroProps> = ({ 
  state, params, setParams, onSearch, elapsedTime, isDarkMode 
}) => {
  const labelClasses = "block text-xs font-bold mb-1.5 ml-1 uppercase tracking-widest dark:text-gray-400 text-gray-700";
  const inputContainerClasses = "relative group";
  const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors dark:text-gray-400 dark:group-focus-within:text-blue-500 text-gray-400 group-hover:text-gray-600 group-focus-within:text-blue-600";
  const inputClasses = `
    w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all shadow-sm font-medium
    bg-white border border-gray-300 text-gray-900 placeholder-gray-500
    focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 
    dark:bg-slate-800/50 dark:border-slate-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-slate-800 dark:focus:border-blue-500/50
  `;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-16">
      <div className="flex flex-col items-center mb-10">
        <div className="scale-110 mb-4">
          <RobotMascot state={state} />
        </div>
        
        {(state === AppState.SEARCHING || (elapsedTime > 0 && state !== AppState.IDLE)) && (
          <div className={`mb-4 backdrop-blur border rounded-full px-4 py-1 text-sm font-mono flex items-center gap-2 shadow-sm animate-in fade-in ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-gray-300' : 'bg-white/80 border-gray-200 text-gray-600'}`}>
             <Clock className={`w-3.5 h-3.5 ${state === AppState.SEARCHING ? 'animate-pulse text-blue-500' : ''}`} />
             <span>Tempo: {formatTime(elapsedTime)}</span>
          </div>
        )}

        <h2 className={`text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r text-center tracking-tight mb-4 ${isDarkMode ? 'from-white via-blue-200 to-white' : 'from-gray-900 via-blue-800 to-gray-900'}`}>
          Prospecção Inteligente
        </h2>
        <p className={`text-center max-w-lg text-lg leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Localize empresas, filtre contatos qualificados e exporte leads diretamente do Google Maps com inteligência artificial.
        </p>
      </div>

      <div className={`backdrop-blur-xl rounded-3xl shadow-2xl border p-8 relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/80 shadow-blue-900/10 border-slate-700' : 'bg-white shadow-xl shadow-blue-900/5 border-gray-100'}`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500"></div>

        <form id="search-form" onSubmit={(e) => onSearch(e, false)} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={inputContainerClasses}>
              <label className={labelClasses}>Localização</label>
              <div className="relative">
                <MapPin className={iconClasses} />
                <input type="text" placeholder="Ex: São Paulo, SP" value={params.location} onChange={(e) => setParams({ ...params, location: e.target.value })} className={inputClasses} required />
              </div>
            </div>
            <div className={inputContainerClasses}>
              <label className={labelClasses}>Raio de Busca</label>
              <div className="relative">
                <Navigation className={iconClasses} />
                <input type="text" placeholder="Ex: 5km" value={params.radius} onChange={(e) => setParams({ ...params, radius: e.target.value })} className={inputClasses} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={inputContainerClasses}>
              <label className={labelClasses}>Nicho de Mercado</label>
              <div className="relative">
                <Briefcase className={iconClasses} />
                <input type="text" placeholder="Ex: Odontologia" value={params.niche} onChange={(e) => setParams({ ...params, niche: e.target.value })} className={inputClasses} required />
              </div>
            </div>
            <div className={inputContainerClasses}>
              <label className={labelClasses}>Tipo de Empresa</label>
              <div className="relative">
                <Target className={iconClasses} />
                <input type="text" placeholder="Ex: Clínicas" value={params.type} onChange={(e) => setParams({ ...params, type: e.target.value })} className={inputClasses} />
              </div>
            </div>
          </div>

          <div className={`space-y-6 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
            <button type="button" onClick={() => setParams({...params, whatsappOnly: !params.whatsappOnly})} className={`inline-flex items-center cursor-pointer p-2 rounded-lg select-none active:scale-95 hover:scale-[1.02] ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}>
              <div className="relative">
                <div className={`w-11 h-6 rounded-full transition-all duration-300 ${params.whatsappOnly ? 'bg-green-500' : (isDarkMode ? 'bg-slate-700' : 'bg-gray-200')}`}></div>
                <div className={`absolute top-1 left-1 bg-white border w-4 h-4 rounded-full transition-all duration-300 ${params.whatsappOnly ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
              <span className={`ml-3 text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <MessageCircle className={`w-4 h-4 ${params.whatsappOnly ? 'text-green-500' : 'text-gray-400'}`} /> Apenas com WhatsApp
              </span>
            </button>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               {[
                 { key: 'deepSearchWeb', icon: Globe, label: 'Site', color: 'blue' },
                 { key: 'deepSearchInstagram', icon: Instagram, label: 'Insta', color: 'pink' },
                 { key: 'deepSearchFacebook', icon: Facebook, label: 'Face', color: 'blue' },
                 { key: 'deepSearchLinkedin', icon: Linkedin, label: 'LinkedIn', color: 'blue' }
               ].map((item) => (
                 <button key={item.key} type="button" onClick={() => setParams({...params, [item.key]: !params[item.key as keyof SearchParams]})} className={`flex items-center justify-between p-3 rounded-xl border transition-all active:scale-95 ${params[item.key as keyof SearchParams] ? (isDarkMode ? `bg-${item.color}-900/30 border-${item.color}-700 text-${item.color}-300` : `bg-${item.color}-50 border-${item.color}-300 text-${item.color}-800`) : (isDarkMode ? 'bg-slate-800 border-slate-700 text-gray-400' : 'bg-white border-gray-300 text-gray-600')}`}>
                   <div className="flex items-center gap-2">
                     <item.icon className={`w-4 h-4 ${params[item.key as keyof SearchParams] ? '' : 'text-gray-400'}`} />
                     <span className="text-sm font-semibold">{item.label}</span>
                   </div>
                   {params[item.key as keyof SearchParams] && <Check className="w-3 h-3" />}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button type="button" onClick={(e) => onSearch(e, true)} disabled={state === AppState.SEARCHING} className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-lg transition-all ${state === AppState.SEARCHING ? 'opacity-50 cursor-not-allowed' : (isDarkMode ? 'bg-amber-900/40 text-amber-400 border border-amber-900/50' : 'text-amber-700 bg-amber-50 border border-amber-200')}`}>
               {state === AppState.SEARCHING && params.fastMode ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
               <span>Rápida</span>
            </button>
            <button type="submit" disabled={state === AppState.SEARCHING} className={`flex-[2] flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-white font-bold text-lg transition-all relative overflow-hidden group ${state === AppState.SEARCHING ? 'bg-slate-300' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}>
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-scan pointer-events-none"></div>
              {state === AppState.SEARCHING && !params.fastMode ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
              <span>{state === AppState.SEARCHING ? 'Buscando...' : 'Iniciar Prospecção'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
