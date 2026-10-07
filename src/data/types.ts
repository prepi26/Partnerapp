/** Kalenderdatum ohne Uhrzeit im Format YYYY-MM-DD (vermeidet Zeitzonen-Fehler). */
export type ISODate = string;

export type PartnerKey = 'a' | 'b';

// Die Typen entsprechen 1:1 den Tabellen in supabase/schema.sql.

export interface Couple {
  id: string;
  partner_a: string;
  partner_b: string | null;
  name_a: string;
  name_b: string;
  start_date: ISODate;
  invite_code: string;
  /** Bis wann „Wir zwei Plus“ für beide gilt (setzt nur der Server). */
  plus_until?: string | null;
}

export interface Memory {
  id: string;
  title: string;
  date: ISODate;
  text: string;
  photo_path: string | null;
  created_by: string;
  created_at: string;
}

export type WishCategory = 'reise' | 'erlebnis' | 'geschenk' | 'sonstiges';

export interface Wish {
  id: string;
  title: string;
  note: string;
  category: WishCategory;
  author: PartnerKey | 'both';
  done: boolean;
  done_at: string | null;
  created_at: string;
}

export interface SpecialDate {
  id: string;
  title: string;
  date: ISODate;
  emoji: string;
  yearly: boolean;
  created_at: string;
}

export interface Note {
  id: string;
  author_id: string;
  text: string;
  created_at: string;
}

export interface Mood {
  user_id: string;
  day: ISODate;
  emoji: string;
}

export interface Answer {
  user_id: string;
  day: ISODate;
  answer: string;
  created_at: string;
}

export interface DateIdea {
  id: string;
  title: string;
  emoji: string;
  done: boolean;
  created_at: string;
}

export type QuestionPack = 'tiefgang' | 'zukunft' | 'prickelnd';

export interface PackAnswer {
  user_id: string;
  pack: QuestionPack;
  day: ISODate;
  answer: string;
  created_at: string;
}
