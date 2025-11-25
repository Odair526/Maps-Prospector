
import React from 'react';
import { BusinessContact } from '../types';
import { MapPin, Phone, Mail, ExternalLink, MessageCircle, Globe, Instagram, Facebook, Building2, Linkedin, Star } from 'lucide-react';

interface ContactCardProps {
  contact: BusinessContact;
  index: number;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, index }) => {
  // Staggered animation delay based on index
  const style = { animationDelay: `${index * 0.05}s` };

  // Helper to format number for WhatsApp API (Defaulting to Brazil +55 if not present)
  const getWhatsAppUrl = (phone: string) => {
    const safePhone = phone || '';
    const digits = safePhone.replace(/\D/g, '');
    const finalNumber = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${finalNumber}`;
  };

  // Helper to render stars
  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex items-center gap-0.5" title={`${rating} estrelas`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div 
      className="group relative backdrop-blur-sm rounded-2xl p-5 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards
        bg-white border border-gray-200 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300
        dark:bg-slate-800/80 dark:border-slate-700/50 dark:hover:border-blue-500/30 dark:hover:shadow-blue-900/10"
      style={style}
    >
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
         <div className="w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
      </div>

      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex items-start gap-3 w-full">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm group-hover:scale-110 transition-transform duration-300
            bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 text-blue-600
            dark:from-slate-700 dark:to-slate-800 dark:border-slate-600 dark:text-blue-400">
             {index + 1}
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="text-lg font-bold leading-tight truncate group-hover:text-blue-600 transition-colors
              text-gray-900 dark:text-gray-100 dark:group-hover:text-blue-400">
              {contact.nome}
            </h3>
            <div className="flex items-center gap-2 mt-1">
               {/* Rating Display */}
               {contact.rating ? (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border
                   bg-yellow-50 border-yellow-200
                   dark:bg-yellow-900/20 dark:border-yellow-900/40">
                   <span className="text-xs font-bold text-yellow-800 dark:text-yellow-500">{contact.rating}</span>
                   {renderStars(contact.rating)}
                   <span className="text-[10px] font-medium text-gray-500 dark:text-gray-500">({contact.reviewCount || 0})</span>
                 </div>
               ) : (
                 <p className="text-xs text-gray-400 flex items-center gap-1">
                   <Building2 className="w-3 h-3" /> Empresa
                 </p>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-sm relative z-10 mt-3 text-gray-600 dark:text-gray-300">
        <div className="h-px w-full my-2 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-slate-600"></div>

        {/* Phone / WhatsApp */}
        {contact.telefone && contact.telefone !== "Não disponível no Maps" && (
          <div className="flex items-center justify-between p-2 rounded-lg transition-colors border border-transparent
            bg-gray-50 hover:bg-blue-50 hover:border-blue-100
            dark:bg-slate-700/30 dark:hover:bg-slate-700/50 dark:hover:border-slate-600">
            <div className="flex items-center gap-3 overflow-hidden">
               <div className={`p-1.5 rounded-md ${
                 contact.whatsapp 
                   ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                   : 'bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-gray-400'
               }`}>
                 {contact.whatsapp ? <MessageCircle className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
               </div>
               <span className="font-medium truncate text-gray-800 dark:text-gray-200">{contact.telefone}</span>
            </div>
            
            {contact.whatsapp && (
              <a 
                href={getWhatsAppUrl(contact.telefone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-xs bg-green-600 text-white px-2 py-1 rounded-md font-medium hover:bg-green-700 transition-colors flex items-center gap-1 shadow-sm shadow-green-200 dark:shadow-none"
              >
                Abrir <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
        
        {/* Email */}
        {contact.email && contact.email !== "Não disponível no Maps" && (
          <div className="flex items-center gap-3 px-2">
            <Mail className="w-4 h-4 text-red-500 flex-shrink-0" />
            <a href={`mailto:${contact.email}`} className="hover:text-red-600 transition-colors truncate border-b border-transparent hover:border-red-200
              text-gray-700 dark:text-gray-300 dark:hover:text-red-400 dark:hover:border-red-900">
              {contact.email}
            </a>
          </div>
        )}
        
        {/* Website */}
        {contact.website && contact.website !== "Não disponível no Maps" && (
           <div className="flex items-center gap-3 px-2">
             <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
             <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline truncate dark:text-blue-400">
               {contact.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
             </a>
           </div>
        )}

        {/* Instagram */}
        {contact.instagram && contact.instagram !== "Não disponível no Maps" && (
           <div className="flex items-center gap-3 px-2">
             <Instagram className="w-4 h-4 text-pink-500 flex-shrink-0" />
             <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-700 hover:underline truncate dark:text-pink-400">
               Perfil do Instagram
             </a>
           </div>
        )}

        {/* Facebook */}
        {contact.facebook && contact.facebook !== "Não disponível no Maps" && (
           <div className="flex items-center gap-3 px-2">
             <Facebook className="w-4 h-4 text-blue-700 flex-shrink-0 dark:text-blue-500" />
             <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline truncate dark:text-blue-400">
               Perfil do Facebook
             </a>
           </div>
        )}

        {/* LinkedIn */}
        {contact.linkedin && contact.linkedin !== "Não disponível no Maps" && (
           <div className="flex items-center gap-3 px-2">
             <Linkedin className="w-4 h-4 text-blue-600 flex-shrink-0 dark:text-blue-500" />
             <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline truncate dark:text-blue-400">
               Perfil do LinkedIn
             </a>
           </div>
        )}

        {/* Address */}
        {contact.endereco && contact.endereco !== "Não disponível no Maps" && (
          <div className="flex items-start gap-3 px-2 pt-1">
            <MapPin className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <span className="leading-snug text-xs text-gray-600 dark:text-gray-400">{contact.endereco}</span>
          </div>
        )}
      </div>

      {contact.link_maps && contact.link_maps !== "Não disponível no Maps" && (
        <a 
          href={contact.link_maps} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center w-full py-2.5 gap-2 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden group-hover:shadow-md
            text-gray-700 bg-gray-100 hover:bg-blue-600 hover:text-white
            dark:text-gray-300 dark:bg-slate-700 dark:hover:bg-blue-500 dark:hover:text-white"
        >
          <span className="relative z-10 flex items-center gap-2">
            Ver no Google Maps <ExternalLink className="w-3 h-3" />
          </span>
        </a>
      )}
    </div>
  );
};
