-- Demo-Familie für Store-Screenshots. Vorher e2e/demo-users.js ausführen und die beiden IDs unten eintragen.
\set A '''be234adb-d666-46d0-8220-6b412eb60597'''
\set B '''d4791137-a97e-4b53-ab94-d5c942d01ef6'''
set role authenticated;
select set_config('request.jwt.claim.sub', :A, false);
update families set schedule_model = 'wechsel_7_7', schedule_start = '2026-10-12', schedule_first = 'a', children = 'Mia';
insert into expenses (title, category, amount_cents, day, paid_by, share_a, need) values
  ('Winterjacke', 'kleidung', 7990, '2026-10-14', 'a', 50, 'regular'),
  ('Zahnspange Eigenanteil', 'gesundheit', 24000, '2026-10-16', 'a', 50, 'mehrbedarf');
insert into messages (text) values ('Hallo Thomas, Mias Kieferorthopäde hat den Kostenplan geschickt. Eigenanteil 240 €. Teilen wir wie besprochen 50/50?');
insert into decisions (category, title, details) values ('gesundheit', 'Zahnspange für Mia', 'Der Kieferorthopäde empfiehlt eine lose Zahnspange ab November. Eigenanteil 240 €.');
insert into handovers (day, status, minutes_late, note) values ('2026-10-12', 'on_time', 0, 'Sportsachen und Brille mitgegeben.');
insert into child_info (category, label, value) values
  ('gesundheit', 'Kinderärztin', 'Dr. Weber, Hauptstr. 5, 02451 123456'),
  ('gesundheit', 'Allergien', 'Haselnuss (leicht)'),
  ('schule', 'Schule / Kita', 'Grundschule am Park, Klasse 2b'),
  ('groessen', 'Schuhgröße', '31'),
  ('groessen', 'Kleidergröße', '128');
insert into agreements (content) values ('{"betreuung":"Wechselmodell 7/7: Wechsel jeden Montag nach der Schule.","uebergabe":"Montags an der Schule. Wer abholt, bringt die Sportsachen mit. Bis 15 Minuten Verspätung kurz per Nachricht Bescheid geben.","ferien":"Sommerferien je 3 Wochen am Stück, Planung bis 31. Januar.","kommunikation":"Absprachen nur über Zwei Zuhause. Antwort innerhalb von 24 Stunden. Keine Botschaften über Mia."}');
insert into journal (day, text) values ('2026-10-19', 'Mia hat erzählt, dass sie sich auf das Fußballturnier freut. Nach der Übergabe gut gelaunt.');
select set_config('request.jwt.claim.sub', :B, false);
select accept_agreement((select id from agreements limit 1));
select answer_decision((select id from decisions where title like 'Zahnspange%'), true, 'Einverstanden, 50/50.');
select answer_expense((select id from expenses where title = 'Winterjacke'), true);
select reply_handover((select id from handovers limit 1), true, '');
insert into messages (text) values ('Ja, passt. Ich überweise meinen Anteil diese Woche.');
insert into expenses (title, category, amount_cents, day, paid_by, share_a, need) values
  ('Fußballverein Jahresbeitrag', 'freizeit', 9600, '2026-10-05', 'b', 50, 'regular'),
  ('Klassenfahrt Anzahlung', 'schule', 12000, '2026-10-20', 'b', 50, 'regular');
insert into handovers (day, status, minutes_late, note) values ('2026-10-19', 'late', 20, 'Stau auf der A46, kurz vorher Bescheid gegeben.');
insert into decisions (category, title, details, due_date) values ('reise', 'Klassenfahrt nach Italien im Mai', '5 Tage Gardasee mit der Klasse, 380 € insgesamt. Anmeldung bis 10. November.', '2026-11-08');
insert into schedule_changes (day, parent, note) values
  ('2026-11-06', 'b', 'Geburtstag von Oma Inge, Familienfeier in Köln'),
  ('2026-11-07', 'b', 'Geburtstag von Oma Inge, Familienfeier in Köln');
insert into messages (text) values ('Wegen Omas Geburtstag: Ich habe dir einen Tausch fürs Wochenende 6./7. November geschickt.');
select set_config('request.jwt.claim.sub', :A, false);
select answer_expense((select id from expenses where title = 'Fußballverein Jahresbeitrag'), true);
select reply_handover((select id from handovers where day = '2026-10-19'), true, 'Danke fürs Bescheid geben.');
insert into messages (text) values ('Danke! Den Tausch schaue ich mir heute Abend an.');
select mark_messages_read();
select set_config('request.jwt.claim.sub', :B, false);
select mark_messages_read();
reset role;
-- Zeitstempel über die letzten Tage verteilen (nur für die Demo).
update messages set created_at = timestamptz '2026-10-16 18:12' , read_at = timestamptz '2026-10-16 19:40' where seq = (select min(seq) from messages);
update messages m set created_at = v.t, read_at = v.r from (values
  (1, timestamptz '2026-10-16 20:03', timestamptz '2026-10-17 07:15'),
  (2, timestamptz '2026-10-20 17:31', timestamptz '2026-10-20 18:02'),
  (3, timestamptz '2026-10-20 18:05', timestamptz '2026-10-20 18:20')) v(n, t, r)
 where m.seq = (select seq from messages order by seq offset v.n limit 1);
update decisions set created_at = '2026-10-16 18:15', answered_at = '2026-10-16 20:05' where title like 'Zahnspange%';
update decisions set created_at = '2026-10-20 17:25' where title like 'Klassenfahrt%';
update expenses set created_at = day + time '19:00', answered_at = case when status <> 'open' then day + time '21:00' end;
update handovers set created_at = day + time '17:10', replied_at = day + time '18:30';
update schedule_changes set created_at = '2026-10-20 17:28';
update agreements set created_at = '2026-10-10 20:00', accepted_a_at = '2026-10-10 20:00', accepted_b_at = '2026-10-11 09:30';
update child_info set updated_at = '2026-10-15 21:00';
update journal set created_at = '2026-10-19 21:30';
