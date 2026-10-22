import { auth } from './auth';
import { calendar } from './calendar';
import { common } from './common';
import { family } from './family';
import { home } from './home';
import { lib } from './lib';
import { messages } from './messages';
import { money } from './money';
import { pro } from './pro';
import { settings } from './settings';

/** Deutsch ist die Quellsprache: alle anderen Sprachen haben genau dieselbe Struktur. */
export const de = { common, lib, auth, home, calendar, money, messages, family, pro, settings };
