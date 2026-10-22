import { Handover, HandoverStatus } from '@/data/types';
import { currentT, Dict, fmt } from '@/i18n';

export const HANDOVER_EMOJI: Record<HandoverStatus, string> = { on_time: '✅', late: '⏰', missed: '❌' };
export const HANDOVER_KEYS: HandoverStatus[] = ['on_time', 'late', 'missed'];

export function handoverLabel(h: Pick<Handover, 'status' | 'minutes_late'>, t: Dict = currentT()) {
  const late = h.status === 'late' && h.minutes_late ? ` (${fmt(t.lib.handoverStatus.minutes, { n: h.minutes_late })})` : '';
  return `${HANDOVER_EMOJI[h.status]} ${t.lib.handoverStatus[h.status]}${late}`;
}
