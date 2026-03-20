CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    company VARCHAR(255),
    job_title VARCHAR(255),
    industry VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaigns (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    goal TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('Email', 'LinkedIn', 'SMS')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE customer_behaviors (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL CHECK (source IN ('website', 'social_media', 'google_search')),
    behavior_type VARCHAR(50) NOT NULL CHECK (behavior_type IN ('page_view', 'download', 'like', 'search_interest')),
    details TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE generated_messages (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
    subject VARCHAR(255) NOT NULL,
    message_body TEXT NOT NULL,
    ai_reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX idx_customer_behaviors_customer_id ON customer_behaviors(customer_id);
CREATE INDEX idx_customer_behaviors_signal ON customer_behaviors(customer_id, source, behavior_type, score);
CREATE INDEX idx_generated_messages_customer_id ON generated_messages(customer_id);
CREATE INDEX idx_generated_messages_campaign_id ON generated_messages(campaign_id);
