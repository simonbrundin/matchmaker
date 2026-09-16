-- Cashcard balance tracking for Lyca mobile
CREATE TABLE cashcard_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    balance DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SEK',
    raw_response TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add Lyca phone number config (for balance check)
CREATE TABLE cashcard_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    check_command TEXT NOT NULL DEFAULT 'SALDO',
    shortcode TEXT NOT NULL DEFAULT '1750',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default config for Lyca Sweden
INSERT INTO cashcard_config (phone_number, check_command, shortcode)
VALUES ('+46 769 734 169', 'SALDO', '3535');

-- Trigger to update updated_at
CREATE TRIGGER update_cashcard_config_updated_at
    BEFORE UPDATE ON cashcard_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
