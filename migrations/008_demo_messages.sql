-- Demo data för att testa /messages sidan
-- Kör denna fil i Supabase SQL Editor

-- Skapa demo-spelare (ta bort befintliga först om de finns)
DELETE FROM players WHERE phone IN ('+46701234567', '+46701234568', '+46701234569', '+46701234570');

INSERT INTO players (id, phone, first_name, last_name, elo, is_active) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', '+46701234567', 'Anna', 'Svensson', 1350, true),
  ('a1b2c3d4-0000-0000-0000-000000000002', '+46701234568', 'Björn', 'Johansson', 1200, true),
  ('a1b2c3d4-0000-0000-0000-000000000003', '+46701234569', 'Clara', 'Lindberg', 1100, true),
  ('a1b2c3d4-0000-0000-0000-000000000004', '+46701234570', 'David', 'Ekström', 1250, true);

-- Skapa en bokning
INSERT INTO bookings (id, scheduled_date, scheduled_time, status) VALUES
  ('b1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE + 3, '18:00', 'pending');

-- Lägg till spelare till bokningen
INSERT INTO booked_players (id, booking_id, player_id, status, response, invite_number) VALUES
  ('c1b2c3d4-0000-0000-0000-000000000001', 'b1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'confirmed', 'ja', 1),
  ('c1b2c3d4-0000-0000-0000-000000000002', 'b1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'invited', null, 1),
  ('c1b2c3d4-0000-0000-0000-000000000003', 'b1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000003', 'invited', null, 1);

-- Lägg till meddelanden
INSERT INTO messages (booking_id, player_id, direction, content, sent_at, response_received_at, response) VALUES
  ('b1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'outgoing', 'Hej Anna! Vill du spela tennis måndag 18:00?', NOW() - INTERVAL '2 days', NULL, NULL),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'incoming', 'Ja, jag kan!', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes', NOW() - INTERVAL '2 days' + INTERVAL '30 minutes', 'ja'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'outgoing', 'Perfekt! Vi ses då.', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', NULL, NULL),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'outgoing', 'Hej Björn! Vill du spela tennis måndag 18:00?', NOW() - INTERVAL '1 day', NULL, NULL),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000002', 'incoming', 'Kan jag kanske, har lite ont om tid just nu', NOW() - INTERVAL '1 day' + INTERVAL '2 hours', NOW() - INTERVAL '1 day' + INTERVAL '2 hours', 'kanske'),
  ('b1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000003', 'outgoing', 'Hej Clara! Vill du spela tennis måndag 18:00?', NOW() - INTERVAL '12 hours', NULL, NULL);

-- Skapa en till bokning med endast Clara (äldre)
INSERT INTO bookings (id, scheduled_date, scheduled_time, status) VALUES
  ('b1b2c3d4-0000-0000-0000-000000000002', CURRENT_DATE - 7, '19:00', 'completed');

INSERT INTO booked_players (id, booking_id, player_id, status, response, invite_number) VALUES
  ('c1b2c3d4-0000-0000-0000-000000000004', 'b1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000003', 'confirmed', 'ja', 1);

INSERT INTO messages (booking_id, player_id, direction, content, sent_at, response_received_at, response) VALUES
  ('b1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000003', 'outgoing', 'Hej Clara! Kan du spela förra måndag 19:00?', NOW() - INTERVAL '10 days', NULL, NULL),
  ('b1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000003', 'incoming', 'Ja, det går bra!', NOW() - INTERVAL '10 days' + INTERVAL '1 hour', NOW() - INTERVAL '10 days' + INTERVAL '1 hour', 'ja');