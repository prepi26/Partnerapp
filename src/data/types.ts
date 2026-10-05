/** Kalenderdatum ohne Uhrzeit im Format YYYY-MM-DD (vermeidet Zeitzonen-Fehler). */
export type ISODate = string;

export type PartnerKey = 'a' | 'b';

export interface Couple {
  partnerA: string;
  partnerB: string;
  startDate: ISODate;
}

export interface Memory {
  id: string;
  title: string;
  date: ISODate;
  text: string;
  photoUri?: string;
  createdAt: number;
}

export type WishCategory = 'reise' | 'erlebnis' | 'geschenk' | 'sonstiges';

export interface Wish {
  id: string;
  title: string;
  note: string;
  category: WishCategory;
  author: PartnerKey | 'both';
  done: boolean;
  doneAt?: number;
  createdAt: number;
}

export interface SpecialDate {
  id: string;
  title: string;
  date: ISODate;
  emoji: string;
  yearly: boolean;
  createdAt: number;
}

export interface AppState {
  version: 1;
  couple: Couple | null;
  memories: Memory[];
  wishes: Wish[];
  dates: SpecialDate[];
}

export const emptyState: AppState = {
  version: 1,
  couple: null,
  memories: [],
  wishes: [],
  dates: [],
};
