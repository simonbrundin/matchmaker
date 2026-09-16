-- Mock data for matchmaker test database
-- Fakerade spelare för att köra tester mot

-- Test players
INSERT INTO players (phone, first_name, last_name, elo, is_active) VALUES
  ('+46701234567', 'Anna', 'Svensson', 1200, true),
  ('+46701234568', 'Erik', 'Johansson', 1350, true),
  ('+46701234569', 'David', 'Ekström', 1100, true),
  ('+46701234570', 'Clara', 'Lindberg', 1250, true),
  ('+46701234571', 'Björn', 'Karlsson', 1400, true),
  ('+46701234572', 'Emma', 'Wallin', 1150, true),
  ('+46701234573', 'Lars', 'Nilsson', 1300, true),
  ('+46701234574', 'Maria', 'Gustavsson', 1280, true),
  ('+46701234575', 'Johan', 'Andersson', 1220, true),
  ('+46701234576', 'Sofia', 'Pettersson', 1180, true);

-- Friends (some connections between players)
INSERT INTO friends (player_id, friend_id, priority) 
SELECT p1.id, p2.id, 1
FROM players p1, players p2
WHERE p1.phone = '+46701234567' AND p2.phone = '+46701234568';

INSERT INTO friends (player_id, friend_id, priority)
SELECT p1.id, p2.id, 2
FROM players p1, players p2
WHERE p1.phone = '+46701234567' AND p2.phone = '+46701234569';

-- Weekly times for some players
INSERT INTO weekly_times (player_id, day_of_week, time, is_active)
SELECT id, 1, '18:00', true FROM players WHERE phone = '+46701234567';

INSERT INTO weekly_times (player_id, day_of_week, time, is_active)
SELECT id, 3, '19:00', true FROM players WHERE phone = '+46701234568';

INSERT INTO weekly_times (player_id, day_of_week, time, is_active)
SELECT id, 5, '18:30', true FROM players WHERE phone = '+46701234569';