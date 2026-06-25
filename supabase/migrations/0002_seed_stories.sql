-- Seed delle 7 storie (contenuto editoriale fisso). Le storie esistono sempre;
-- l'Admin gestisce video/quiz RELATIVI a queste (ADR-9), non le crea.
-- Titoli allineati al frontend (src/data/indizi.ts). sinossi/images li riempie
-- l'editoria (o un'eventuale modifica campi storia dal pannello Admin).
-- Idempotente: ON CONFLICT su numero (UNIQUE) non sovrascrive titoli già editati.

insert into stories (numero, titolo) values
  (1, 'La casa delle storie'),
  (2, 'La voce della piazza'),
  (3, 'Il campo di Mazzarò'),
  (4, 'La barca dei Malavoglia'),
  (5, 'Il vicolo di Rosso'),
  (6, 'Il sentiero di Gramigna'),
  (7, 'La festa del paese')
on conflict (numero) do nothing;
