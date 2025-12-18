
import React, { useState } from 'react';
import { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Sun, Moon, History, Download, User as UserIcon, LogOut } from 'lucide-react';

interface NavbarProps {
  user: User;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onShowHistory: () => void;
  onExport: () => void;
  hasResults: boolean;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, isDarkMode, setIsDarkMode, onShowHistory, onExport, hasResults, onOpenProfile 
}) => {
  const { logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-xl shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/70 border-slate-700/50' : 'bg-white/80 border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-default">
           <div className="relative w-10 h-10">
             <div className="absolute inset-0 bg-blue-600 rounded-lg rotate-3 group-hover:rotate-12 transition-transform opacity-20"></div>
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold shadow-lg group-hover:-translate-y-1 transition-transform">
               M
             </div>
           </div>
           <div>
             <h1 className={`text-xl font-bold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Maps <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">Prospector</span></h1>
             <p className="text-[10px] font-medium text-gray-400 tracking-wider uppercase">AI Powered Agent</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
             onClick={() => setIsDarkMode(!isDarkMode)}
             className={`p-2.5 rounded-xl transition-all border ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700 border-slate-700' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-600 border-gray-200'}`}
             title={isDarkMode ? "Modo Claro" : "Modo Noturno"}
          >
             {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button 
            onClick={onShowHistory}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border font-medium text-sm ${isDarkMode ? 'text-gray-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700' : 'text-gray-700 hover:text-blue-600 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'}`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Histórico</span>
          </button>

          {hasResults && (
            <button 
              onClick={onExport}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}

          <div className={`flex items-center gap-3 pl-3 border-l ml-1 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
             <div className="flex flex-col items-end hidden md:flex">
               <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user.name}</span>
               <span className="text-[10px] text-gray-400">Plano Pro</span>
             </div>
             
             <div className="relative">
               <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                 <img 
                   src={user.photoUrl} 
                   alt={user.name} 
                   className={`w-9 h-9 rounded-full border-2 shadow-sm cursor-pointer object-cover transition-colors ${isDarkMode ? 'border-slate-600 hover:border-blue-400' : 'border-gray-200 hover:border-blue-500'}`}
                 />
               </button>
               
               {isProfileMenuOpen && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}></div>
                   <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border p-1 z-50 animate-in fade-in slide-in-from-top-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                      <button onClick={() => { onOpenProfile(); setIsProfileMenuOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors mb-1 ${isDarkMode ? 'text-gray-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                        <UserIcon className="w-4 h-4" /> Meu Perfil
                      </button>
                      <div className={`h-px my-1 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}></div>
                      <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${isDarkMode ? 'text-red-400 hover:bg-slate-700' : 'text-red-600 hover:bg-red-50'}`}>
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
  );
};
