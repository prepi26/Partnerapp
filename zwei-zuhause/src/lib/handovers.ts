import { Handover } from '@/data/types';

export const HANDOVER_STATUS = {
  on_time: { label: 'Pünktlich', emoji: '✅' },
  late: { label: 'Verspätet', emoji: '⏰' },
  missed: { label: 'Ausgefallen', emoji: '❌' },
} as const;

export function handoverLabel(h: Pick<Handover, 'status' | 'minutes_late'>) {
  const s = HANDOVER_STATUS[h.status];
  return `${s.emoji} ${s.label}${h.status === 'late' && h.minutes_late ? ` (${h.minutes_late} Min.)` : ''}`;
}
