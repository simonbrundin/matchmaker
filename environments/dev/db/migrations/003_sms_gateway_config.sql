-- 12. APP_SETTINGS (Dynamic configuration stored in database)
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- SMS Gateway settings
INSERT INTO app_settings (key, value, description)
SELECT 'sms_gateway_url', '', 'SMS Gateway base URL (e.g., https://sms.example.com)'
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'sms_gateway_url');

INSERT INTO app_settings (key, value, description)
SELECT 'sms_gateway_username', '', 'SMS Gateway API username'
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'sms_gateway_username');

INSERT INTO app_settings (key, value, description)
SELECT 'sms_gateway_password', '', 'SMS Gateway API password'
WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = 'sms_gateway_password');

-- Trigger for app_settings updated_at
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
