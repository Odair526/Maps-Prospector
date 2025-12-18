
import React from 'react';
import { SearchHistoryItem } from '../../types';
import { History, X, Clock, MapPin, Target, RotateCcw, Trash2 } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: SearchHistoryItem[];
  onRestore: (item: SearchHistoryItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClear: () => void;
  isDarkMode: boolean;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen, onClose, items, onRestore, onDelete, onClear, isDarkMode
}) => {
  return (
    <div className={`fixed inset-0 z-50 transform transition-all duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} style={{ opacity: isOpen ? 1 : 0 }}></div>
      <div className={`absolute top-0 right-0 h-full w-full max-w-sm backdrop-blur-2xl shadow-2xl border-l flex flex-col transform transition-transform duration-500 ${isDarkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-gray-200'}`}>
         <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
           <div className={`flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <History className="w-5 h-5 text-blue-600" /><h3 className="text-lg font-bold">Histórico Recente</h3>
           </div>
           <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-gray-400"><X className="w-5 h-5" /></button>
         </div>
         <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-10 opacity-50"><Clock className="w-12 h-12 mx-auto mb-3" /><p>Nenhuma pesquisa recente.</p></div>
            ) : (
              items.map((item) => (
                <div key={item.id} onClick={() => onRestore(item)} className={`group relative border rounded-xl p-4 cursor-pointer transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'}`}>
                  <div className="flex justify-between items-start mb-2">
                     <h4 className="font-bold line-clamp-1">{item.params.niche}</h4>
                     <span className="text-[10px] bg-slate-700 text-gray-400 px-2 py-0.5 rounded-full">{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs flex flex-col gap-1 mb-3 text-gray-400">
                     <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.params.location}</span>
                     <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {item.resultCount} contatos</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700">
                     <span className="text-xs text-blue-600 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Restaurar</span>
                     <button onClick={(e) => onDelete(item.id, e)} className="p-1.5 text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))
            )}
         </div>
         {items.length > 0 && (
           <div className="p-4 border-t border-slate-800 bg-slate-900">
              <button onClick={onClear} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-slate-800">
                 <Trash2 className="w-4 h-4" /> Limpar Histórico
              </button>
           </div>
         )}
      </div>
    </div>
  );
};
