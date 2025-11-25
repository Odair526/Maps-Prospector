
export interface BusinessContact {
  nome: string;
  telefone: string;
  whatsapp: boolean;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  linkedin?: string;
  endereco: string;
  link_maps: string;
  rating?: number;
  reviewCount?: number;
  web_summary?: string;
}

export interface SearchParams {
  location: string;
  radius: string;
  niche: string;
  type: string;
  excludeNames?: string[];
  whatsappOnly?: boolean;
  fastMode?: boolean;
  // Deep Search Flags
  deepSearchWeb?: boolean;
  deepSearchInstagram?: boolean;
  deepSearchFacebook?: boolean;
  deepSearchLinkedin?: boolean;
}

export interface SearchHistoryItem {
  id: string;
  timestamp: number;
  params: SearchParams;
  resultCount: number;
}

export enum AppState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
}
