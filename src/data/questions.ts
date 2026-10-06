import { ISODate } from './types';

import { daysBetween, parseISO } from '@/lib/dates';

export const QUESTIONS = [
  'Was war der Moment, in dem du wusstest, dass du mich magst?',
  'Welche kleine Sache, die ich mache, bringt dich immer zum Lächeln?',
  'Wohin würdest du morgen mit mir reisen, wenn Geld keine Rolle spielt?',
  'Was ist deine liebste gemeinsame Erinnerung bisher?',
  'Welches Lied erinnert dich an uns?',
  'Was möchtest du in diesem Jahr unbedingt mit mir erleben?',
  'Wie sieht für dich ein perfekter gemeinsamer Sonntag aus?',
  'Was schätzt du an mir am meisten?',
  'Worüber haben wir zuletzt so richtig gelacht?',
  'Welche Eigenschaft von mir hättest du gern selbst?',
  'Was war unser schönstes Date?',
  'Welches Essen verbindest du mit uns?',
  'Was würdest du gern öfter zusammen machen?',
  'Wo siehst du uns in fünf Jahren?',
  'Was hat dich bei unserem ersten Treffen überrascht?',
  'Welche Gewohnheit von mir findest du heimlich süß?',
  'Was ist ein Traum, den du mir noch nie erzählt hast?',
  'Wofür bist du heute dankbar?',
  'Welcher Film beschreibt unsere Beziehung am besten?',
  'Was war die netteste Geste, die ich je für dich gemacht habe?',
  'Was wäre unser Paar-Name, wenn wir Promis wären?',
  'Welche Tradition sollen wir als Paar anfangen?',
  'Was hat dich diese Woche gestresst – und wie kann ich helfen?',
  'Welche drei Wörter beschreiben uns?',
  'Was ist deine Liebessprache: Worte, Zeit, Geschenke, Hilfe oder Nähe?',
  'In welchem Moment fühlst du dich mir am nächsten?',
  'Welches Abenteuer würdest du mit mir wagen, das dir eigentlich Angst macht?',
  'Was möchtest du von mir lernen?',
  'Welches Haustier hätten wir, und wie würde es heißen?',
  'Was war der lustigste Streit, den wir je hatten?',
  'Welcher Ort fühlt sich für dich nach „uns“ an?',
  'Wie würdest du unseren ersten Kuss beschreiben?',
  'Was ist das Mutigste, das du je gemacht hast?',
  'Wenn wir einen Tag tauschen könnten – was würdest du als ich machen?',
  'Was wolltest du mir schon lange mal sagen?',
  'Welches Kompliment hörst du am liebsten?',
  'Wie können wir uns im Alltag mehr Zeit füreinander nehmen?',
  'Was ist deine schönste Kindheitserinnerung?',
  'Welche Kleinigkeit hat dich heute glücklich gemacht?',
  'Was ist das Erste, was dir an mir aufgefallen ist?',
  'Wie feiern wir unseren nächsten Jahrestag?',
  'Welchen Wunsch soll ich dir dieses Jahr erfüllen?',
  'Welche Serie sollten wir als Nächstes zusammen schauen?',
  'Was macht für dich ein Zuhause aus?',
  'Wann hast du dich zuletzt so richtig von mir geliebt gefühlt?',
  'Welches gemeinsame Ziel sollen wir uns setzen?',
  'Was ist dein Lieblingsfoto von uns und warum?',
  'Wie sieht unser Traumhaus aus?',
  'Welche Frage wolltest du mir schon immer stellen?',
  'Was würdest du deinem jüngeren Ich über uns erzählen?',
] as const;

/** Beide Partner bekommen am selben Kalendertag dieselbe Frage. */
export function questionForDay(day: ISODate): string {
  const n = daysBetween(parseISO('2024-01-01'), parseISO(day));
  return QUESTIONS[((n % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length];
}
