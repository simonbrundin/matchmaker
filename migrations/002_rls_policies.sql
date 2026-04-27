-- Row Level Security Policies
-- Row Level Security Policies
-- Kör denna fil i Supabase SQL Editor

-- Players
DROP POLICY IF EXISTS "Allow all" ON players;
CREATE POLICY "Allow all" ON players
FOR ALL
USING (true)
WITH CHECK (true);

-- Bookings
DROP POLICY IF EXISTS "Allow all" ON bookings;
CREATE POLICY "Allow all" ON bookings
FOR ALL
USING (true)
WITH CHECK (true);

-- Booked Players
DROP POLICY IF EXISTS "Allow all" ON booked_players;
CREATE POLICY "Allow all" ON booked_players
FOR ALL
USING (true)
WITH CHECK (true);

-- Messages
DROP POLICY IF EXISTS "Allow all" ON messages;
CREATE POLICY "Allow all" ON messages
FOR ALL
USING (true)
WITH CHECK (true);

-- Weekly Times
DROP POLICY IF EXISTS "Allow all" ON weekly_times;
CREATE POLICY "Allow all" ON weekly_times
FOR ALL
USING (true)
WITH CHECK (true);

-- Wishlist Times
DROP POLICY IF EXISTS "Allow all" ON wishlist_times;
CREATE POLICY "Allow all" ON wishlist_times
FOR ALL
USING (true)
WITH CHECK (true);

-- Unavailabilities
DROP POLICY IF EXISTS "Allow all" ON unavailabilities;
CREATE POLICY "Allow all" ON unavailabilities
FOR ALL
USING (true)
WITH CHECK (true);

-- Friends
DROP POLICY IF EXISTS "Allow all" ON friends;
CREATE POLICY "Allow all" ON friends
FOR ALL
USING (true)
WITH CHECK (true);

-- AI Response Suggestions
DROP POLICY IF EXISTS "Allow all" ON ai_response_suggestions;
CREATE POLICY "Allow all" ON ai_response_suggestions
FOR ALL
USING (true)
WITH CHECK (true);
-- Kör denna fil i Supabase SQL Editor

-- Players
DROP POLICY IF EXISTS "Allow all" ON players;
CREATE POLICY "Allow all" ON players
FOR ALL
USING (true)
WITH CHECK (true);

-- Bookings
DROP POLICY IF EXISTS "Allow all" ON bookings;
CREATE POLICY "Allow all" ON bookings
FOR ALL
USING (true)
WITH CHECK (true);

-- Booked Players
DROP POLICY IF EXISTS "Allow all" ON booked_players;
CREATE POLICY "Allow all" ON booked_players
FOR ALL
USING (true)
WITH CHECK (true);

-- Messages
DROP POLICY IF EXISTS "Allow all" ON messages;
CREATE POLICY "Allow all" ON messages
FOR ALL
USING (true)
WITH CHECK (true);

-- Weekly Times
DROP POLICY IF EXISTS "Allow all" ON weekly_times;
CREATE POLICY "Allow all" ON weekly_times
FOR ALL
USING (true)
WITH CHECK (true);

-- Wishlist Times
DROP POLICY IF EXISTS "Allow all" ON wishlist_times;
CREATE POLICY "Allow all" ON wishlist_times
FOR ALL
USING (true)
WITH CHECK (true);

-- Unavailabilities
DROP POLICY IF EXISTS "Allow all" ON unavailabilities;
CREATE POLICY "Allow all" ON unavailabilities
FOR ALL
USING (true)
WITH CHECK (true);

-- Friends
DROP POLICY IF EXISTS "Allow all" ON friends;
CREATE POLICY "Allow all" ON friends
FOR ALL
USING (true)
WITH CHECK (true);

-- AI Response Suggestions
DROP POLICY IF EXISTS "Allow all" ON ai_response_suggestions;
CREATE POLICY "Allow all" ON ai_response_suggestions
FOR ALL
USING (true)
WITH CHECK (true);
