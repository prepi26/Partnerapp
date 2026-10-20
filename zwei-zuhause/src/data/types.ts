/** YYYY-MM-DD */
export type ISODate = string;

/** Elternteil a hat die Familie angelegt, b ist mit dem Code beigetreten. */
export type ParentKey = 'a' | 'b';

export type ScheduleModel = 'none' | 'wechsel_7_7' | 'wechsel_2_2_5_5' | 'wechsel_2_2_3' | 'residenz_we';

export interface Family {
  id: string;
  parent_a: string | null;
  parent_b: string | null;
  name_a: string;
  name_b: string;
  children: string;
  invite_code: string;
  schedule_model: ScheduleModel;
  schedule_start: ISODate;
  schedule_first: ParentKey;
  default_share_a: number;
  created_at: string;
}

export type ChangeStatus = 'proposed' | 'accepted' | 'declined';

export interface ScheduleChange {
  id: string;
  family_id: string;
  day: ISODate;
  parent: ParentKey;
  note: string;
  status: ChangeStatus;
  created_by: string | null;
  created_at: string;
  answered_at: string | null;
}

export type ExpenseKind = 'expense' | 'payment';
export type ExpenseStatus = 'open' | 'confirmed' | 'disputed';

export interface Expense {
  id: string;
  family_id: string;
  kind: ExpenseKind;
  title: string;
  category: string;
  amount_cents: number;
  day: ISODate;
  paid_by: ParentKey;
  share_a: number;
  receipt_path: string | null;
  status: ExpenseStatus;
  created_by: string | null;
  created_at: string;
  answered_at: string | null;
}

export interface Message {
  id: string;
  seq: number;
  family_id: string;
  sender: string | null;
  sender_key: ParentKey;
  text: string;
  created_at: string;
  read_at: string | null;
  hash: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  day: ISODate;
  text: string;
  created_at: string;
}
