---
name: grill-me
description: Interview the user relentlessly about a plan, decision or idea until every gap is closed. Use when the user says "grill me", "nimm mich auseinander", "hinterfrag meinen Plan" or asks to stress-test a plan, feature, launch, pricing or business idea.
---

# Grill me

Stress-test the user's plan by asking hard questions **one at a time** until the plan has no open gaps.

## How to run it

1. **Find the subject.** Use what the user named (e.g. "Plus-Abo", "Launch", "Version 1.3"). If nothing is named,
   pick the decision with the biggest consequence in the current conversation and say which one you picked.
2. **Ask exactly one question per message.** Never batch questions. Number them ("Frage 3").
3. **Every question gets your own recommended answer** right below it ("Meine Antwort an deiner Stelle: …"),
   with a confidence tag ([Sicher] / [Wahrscheinlich] / [Vermutung]) and the reason in one or two sentences.
   The user can simply agree, correct or reject it.
4. **Go for the weak spot first:** the assumption that, if wrong, breaks the plan (users, money, time, legal,
   App Store review, technical risk). Then work down to smaller details.
5. **Follow the answer.** If an answer is vague ("mal schauen", "irgendwie"), ask the follow-up that makes it
   concrete: who, what exactly, by when, how measured. Do not move on while the answer is vague.
6. **Hold your position** when the user pushes back without new information; change it only for real new facts.
7. **Look things up instead of asking** when the answer is in the codebase, the docs in this repo
   (`RELEASE_*.md`, `PLUS_SETUP.md`, `STORE_RELEASE.md`) or the data you can read.
8. **Stop** when the next question would no longer change the plan, or when the user says stop.
   Then write a short summary in German:
   - **Entscheidungen** (was jetzt feststeht)
   - **Offene Risiken** (was noch schiefgehen kann)
   - **Nächste Schritte** (wer macht was bis wann)

## Style

- Language: German, direct, no flattery, no warm-up.
- Short messages: one question, one recommendation, nothing else.
- Concrete over abstract: numbers, dates, names, Euro amounts.

## Example turn

> **Frage 2: Wie viel soll Plus kosten – und warum genau dieser Preis?**
>
> **Meine Antwort an deiner Stelle:** 2,99 € im Monat, 19,99 € im Jahr. [Vermutung] Liegt unter Paired/Between und
> ist eine Impulskauf-Schwelle; das Jahresabo bringt den Großteil des Umsatzes.
>
> Was ist deine Antwort?
