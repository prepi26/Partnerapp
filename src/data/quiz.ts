import { daysBetween, parseISO } from '@/lib/dates';

import { ISODate, QuizAnswer } from './types';

/** Ein Thema mit vier Antworten. Gefragt wird „Über dich“ und danach „Über deinen Schatz“. */
export interface QuizQuestion {
  id: string;
  topic: string;
  options: [string, string, string, string];
}

export const QUIZ: QuizQuestion[] = [
  {
    id: 'sonntag',
    topic: 'Der perfekte Sonntag',
    options: ['Ausschlafen & Couch', 'Ausflug ins Grüne', 'Brunch mit Freunden', 'Sport & aktiv sein'],
  },
  {
    id: 'urlaub',
    topic: 'Traumurlaub',
    options: ['Strand & Meer', 'Berge & Wandern', 'Städtetrip', 'Roadtrip ins Blaue'],
  },
  {
    id: 'essen',
    topic: 'Lieblingsessen',
    options: ['Pizza & Pasta', 'Sushi & Asiatisch', 'Burger & Pommes', 'Hausmannskost'],
  },
  {
    id: 'date',
    topic: 'Bestes Date',
    options: ['Schick essen gehen', 'Kino & Popcorn', 'Picknick draußen', 'Zusammen kochen'],
  },
  {
    id: 'morgen',
    topic: 'Morgens bin ich …',
    options: ['sofort hellwach', 'erst nach dem Kaffee ansprechbar', 'ein Snooze-Profi', 'schon beim Sport'],
  },
  {
    id: 'streit',
    topic: 'Nach einem Streit brauche ich …',
    options: ['eine Umarmung', 'kurz Zeit für mich', 'ein klärendes Gespräch', 'etwas Süßes'],
  },
  {
    id: 'geschenk',
    topic: 'Damit machst du mir die größte Freude',
    options: ['ein Erlebnis zusammen', 'etwas Selbstgemachtes', 'eine Überraschung', 'liebe Worte'],
  },
  {
    id: 'film',
    topic: 'Lieblingsfilm-Genre',
    options: ['Komödie', 'Thriller & Krimi', 'Romantik', 'Action & Fantasy'],
  },
  { id: 'tier', topic: 'Wenn ich ein Tier wäre', options: ['Katze', 'Hund', 'Faultier', 'Delfin'] },
  { id: 'jahreszeit', topic: 'Lieblingsjahreszeit', options: ['Frühling', 'Sommer', 'Herbst', 'Winter'] },
  { id: 'getraenk', topic: 'Lieblingsgetränk', options: ['Kaffee', 'Tee', 'Ein gutes Glas Wein', 'Cola & Co.'] },
  {
    id: 'abend',
    topic: 'Ein freier Abend',
    options: ['Serie & Snacks', 'Mit Freunden raus', 'Ein gutes Buch', 'Gaming'],
  },
  {
    id: 'liebe',
    topic: 'So zeige ich Liebe am liebsten',
    options: ['mit Worten', 'mit Zeit zu zweit', 'mit Berührungen', 'mit kleinen Gesten'],
  },
  { id: 'stress', topic: 'Bei Stress hilft mir am meisten', options: ['Sport', 'Reden', 'Schlafen', 'Musik'] },
  {
    id: 'superkraft',
    topic: 'Meine Wunsch-Superkraft',
    options: ['Fliegen', 'Gedanken lesen', 'Zeitreisen', 'Unsichtbar sein'],
  },
  {
    id: 'party',
    topic: 'Auf einer Party bin ich …',
    options: ['auf der Tanzfläche', 'in der Küche am Quatschen', 'am Buffet', 'als Erste:r zu Hause'],
  },
  {
    id: 'reise',
    topic: 'Beim Reisen am wichtigsten',
    options: ['gutes Essen', 'Sehenswürdigkeiten', 'Entspannung', 'Abenteuer'],
  },
  { id: 'musik', topic: 'Lieblingsmusik', options: ['Pop', 'Rock', 'Hip-Hop', 'Schlager & Party'] },
  {
    id: 'wohnen',
    topic: 'Traumzuhause',
    options: ['Loft in der Stadt', 'Haus mit Garten', 'Hütte in den Bergen', 'Haus am Meer'],
  },
  { id: 'suess', topic: 'Lieblingssüßigkeit', options: ['Schokolade', 'Gummibärchen', 'Eis', 'Kuchen'] },
  {
    id: 'kompliment',
    topic: 'Dieses Kompliment freut mich am meisten',
    options: ['über mein Aussehen', 'über meinen Humor', 'über meine Klugheit', 'über mein Herz'],
  },
  {
    id: 'krank',
    topic: 'Wenn ich krank bin, will ich …',
    options: ['umsorgt werden', 'meine Ruhe', 'Suppe & Tee', 'jammern dürfen'],
  },
  {
    id: 'sport',
    topic: 'Sport ist für mich …',
    options: ['Leidenschaft', 'notwendiges Übel', 'ab und zu ganz nett', 'etwas für andere'],
  },
  {
    id: 'ordnung',
    topic: 'Ordnung zu Hause',
    options: ['Alles hat seinen Platz', 'Kreatives Chaos', 'Kommt drauf an, wer zu Besuch kommt', 'Was ist Ordnung?'],
  },
  {
    id: 'wetter',
    topic: 'Perfektes Wetter',
    options: ['Sonne & 30 Grad', 'Frühlingsfrisch', 'Gewitter & Regen', 'Schnee'],
  },
  {
    id: 'geburtstag',
    topic: 'Mein Geburtstag soll sein …',
    options: ['eine große Party', 'ein ruhiger Tag zu zweit', 'ein Ausflug', 'am liebsten ignoriert'],
  },
  {
    id: 'fruehstueck',
    topic: 'Lieblingsfrühstück',
    options: ['Brötchen & Aufschnitt', 'Müsli & Obst', 'Pancakes', 'Nur Kaffee'],
  },
  {
    id: 'serie',
    topic: 'Beim Serien-Schauen',
    options: ['eine Folge reicht', 'ganze Staffel am Stück', 'nebenbei am Handy', 'schlafe ich ein'],
  },
  { id: 'angst', topic: 'Davor gruselt es mich am meisten', options: ['Spinnen', 'Höhe', 'Dunkelheit', 'Leere Akkus'] },
  {
    id: 'zukunft',
    topic: 'In zehn Jahren will ich …',
    options: ['die Welt bereist haben', 'ein schönes Zuhause', 'beruflich angekommen sein', 'einfach glücklich sein'],
  },
  {
    id: 'kochen',
    topic: 'In der Küche bin ich …',
    options: ['Sterne-Koch', 'Rezepte-Nachkocher', 'Lieferdienst-Profi', 'zuständig fürs Probieren'],
  },
  { id: 'feiertag', topic: 'Lieblingsfeiertag', options: ['Weihnachten', 'Silvester', 'Ostern', 'Mein Geburtstag'] },
  {
    id: 'social',
    topic: 'Am Handy verbringe ich die meiste Zeit mit …',
    options: ['Instagram & TikTok', 'Nachrichten schreiben', 'Spielen', 'Nachrichten & Wissen'],
  },
  {
    id: 'kuss',
    topic: 'Der schönste Moment für einen Kuss',
    options: ['Morgens zur Begrüßung', 'Zum Abschied', 'Ganz spontan', 'Vor dem Einschlafen'],
  },
  { id: 'farbe', topic: 'Lieblingsfarbe', options: ['Rot & Pink', 'Blau & Türkis', 'Grün', 'Schwarz & Weiß'] },
  {
    id: 'hobby',
    topic: 'Ein neues Hobby, das ich ausprobieren würde',
    options: ['Tanzen', 'Malen', 'Klettern', 'Ein Instrument'],
  },
];

export const QUIZ_PER_DAY = 3;

/** Drei Fragen pro Tag, für beide gleich, rotierend durch alle Themen. */
export function quizForDay(day: ISODate): QuizQuestion[] {
  const index = Math.max(0, daysBetween(parseISO('2026-01-01'), parseISO(day)));
  return Array.from({ length: QUIZ_PER_DAY }, (_, i) => QUIZ[(index * QUIZ_PER_DAY + i) % QUIZ.length]);
}

export interface QuizRound {
  day: ISODate;
  mine: QuizAnswer[];
  theirs: QuizAnswer[];
  /** Wie viele Tipps richtig waren – erst gesetzt, wenn beide gespielt haben. */
  myScore: number | null;
  theirScore: number | null;
}

/** Runden pro Tag mit Punkten: ein Punkt, wenn der Tipp die Antwort des anderen trifft. */
export function quizRounds(answers: QuizAnswer[], me: string): QuizRound[] {
  const days = [...new Set(answers.map((a) => a.day))].sort((a, b) => b.localeCompare(a));
  return days.map((day) => {
    const mine = answers.filter((a) => a.day === day && a.user_id === me);
    const theirs = answers.filter((a) => a.day === day && a.user_id !== me);
    const complete = mine.length >= QUIZ_PER_DAY && theirs.length >= QUIZ_PER_DAY;
    const score = (from: QuizAnswer[], other: QuizAnswer[]) =>
      from.filter((a) => other.some((o) => o.question_id === a.question_id && o.own === a.guess)).length;
    return {
      day,
      mine,
      theirs,
      myScore: complete ? score(mine, theirs) : null,
      theirScore: complete ? score(theirs, mine) : null,
    };
  });
}
