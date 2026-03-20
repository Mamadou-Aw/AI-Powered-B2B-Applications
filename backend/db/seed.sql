-- 1) Customers
INSERT INTO customers (full_name, email, company, job_title, industry) VALUES
('Aicha Sall', 'aicha@saasflow.io', 'SaaSFlow', 'Growth Lead', 'SaaS'),
('Moussa Diallo', 'moussa@retailhub.co', 'RetailHub', 'Marketing Manager', 'Retail'),
('John Smith', 'john@finpilot.ai', 'FinPilot', 'Revenue Ops', 'Fintech')
ON CONFLICT (email) DO NOTHING;


-- 2) Campaigns
INSERT INTO campaigns (name, goal, channel) VALUES
('Demo Outreach Campaign', 'Encourage leads to book a product demo after repeated product-interest activity', 'Email'),
('Pricing Follow-up Campaign', 'Follow up with leads repeatedly checking pricing and solution pages', 'Email'),
('LinkedIn Follow-up Campaign', 'Re-engage social media leads with a softer follow-up touchpoint', 'LinkedIn')
ON CONFLICT (name) DO NOTHING;


-- 3) Customer behaviors
-- Cette version insère les comportements un par un
-- seulement s'ils n'existent pas déjà.

INSERT INTO customer_behaviors (customer_id, source, behavior_type, details, score)
SELECT c.id, 'website', 'page_view', 'Visited pricing page', 88
FROM customers c
WHERE c.email = 'aicha@saasflow.io'
AND NOT EXISTS (
    SELECT 1
    FROM customer_behaviors cb
    WHERE cb.customer_id = c.id
      AND cb.source = 'website'
      AND cb.behavior_type = 'page_view'
      AND cb.details = 'Visited pricing page'
);

INSERT INTO customer_behaviors (customer_id, source, behavior_type, details, score)
SELECT c.id, 'website', 'page_view', 'Returned to pricing page comparison section', 90
FROM customers c
WHERE c.email = 'aicha@saasflow.io'
AND NOT EXISTS (
    SELECT 1
    FROM customer_behaviors cb
    WHERE cb.customer_id = c.id
      AND cb.source = 'website'
      AND cb.behavior_type = 'page_view'
      AND cb.details = 'Returned to pricing page comparison section'
);

INSERT INTO customer_behaviors (customer_id, source, behavior_type, details, score)
SELECT c.id, 'website', 'page_view', 'Viewed pricing FAQ and enterprise pricing', 86
FROM customers c
WHERE c.email = 'aicha@saasflow.io'
AND NOT EXISTS (
    SELECT 1
    FROM customer_behaviors cb
    WHERE cb.customer_id = c.id
      AND cb.source = 'website'
      AND cb.behavior_type = 'page_view'
      AND cb.details = 'Viewed pricing FAQ and enterprise pricing'
);

INSERT INTO customer_behaviors (customer_id, source, behavior_type, details, score)
SELECT c.id, 'social_media', 'like', 'Liked LinkedIn campaign about CRM automation', 74
FROM customers c
WHERE c.email = 'aicha@saasflow.io'
AND NOT EXISTS (
    SELECT 1
    FROM customer_behaviors cb
    WHERE cb.customer_id = c.id
      AND cb.source = 'social_media'
      AND cb.behavior_type = 'like'
      AND cb.details = 'Liked LinkedIn campaign about CRM automation'
);

INSERT INTO customer_behaviors (customer_id, source, behavior_type, details, score)
SELECT c.id, 'google_search', 'search_interest', 'Searched for hyper-personalized B2B outreach tools', 67
FROM customers c
WHERE c.email = 'moussa@retailhub.co'
AND NOT EXISTS (
    SELECT 1
    FROM customer_behaviors cb
    WHERE cb.customer_id = c.id
      AND cb.source = 'google_search'
      AND cb.behavior_type = 'search_interest'
      AND cb.details = 'Searched for hyper-personalized B2B outreach tools'
);

INSERT INTO customer_behaviors (customer_id, source, behavior_type, details, score)
SELECT c.id, 'website', 'download', 'Downloaded buyer guide PDF', 92
FROM customers c
WHERE c.email = 'john@finpilot.ai'
AND NOT EXISTS (
    SELECT 1
    FROM customer_behaviors cb
    WHERE cb.customer_id = c.id
      AND cb.source = 'website'
      AND cb.behavior_type = 'download'
      AND cb.details = 'Downloaded buyer guide PDF'
);

INSERT INTO customer_behaviors (customer_id, source, behavior_type, details, score)
SELECT c.id, 'website', 'download', 'Downloaded ROI calculator PDF', 89
FROM customers c
WHERE c.email = 'john@finpilot.ai'
AND NOT EXISTS (
    SELECT 1
    FROM customer_behaviors cb
    WHERE cb.customer_id = c.id
      AND cb.source = 'website'
      AND cb.behavior_type = 'download'
      AND cb.details = 'Downloaded ROI calculator PDF'
);

INSERT INTO customer_behaviors (customer_id, source, behavior_type, details, score)
SELECT c.id, 'website', 'download', 'Downloaded implementation checklist PDF', 91
FROM customers c
WHERE c.email = 'john@finpilot.ai'
AND NOT EXISTS (
    SELECT 1
    FROM customer_behaviors cb
    WHERE cb.customer_id = c.id
      AND cb.source = 'website'
      AND cb.behavior_type = 'download'
      AND cb.details = 'Downloaded implementation checklist PDF'
);


-- 4) Generated messages
INSERT INTO generated_messages (customer_id, campaign_id, subject, message_body, ai_reason, status)
SELECT
    c.id,
    cp.id,
    'Aicha, ready to turn pricing-page interest into pipeline?',
    'Hi Aicha, since you returned to our pricing content several times, I thought a short walkthrough focused on ROI and campaign automation for growth teams could help.',
    'Example seed message generated from repeated high-interest pricing page visits.',
    'draft'
FROM customers c
JOIN campaigns cp
    ON cp.name = 'Pricing Follow-up Campaign'
WHERE c.email = 'aicha@saasflow.io'
AND NOT EXISTS (
    SELECT 1
    FROM generated_messages gm
    WHERE gm.customer_id = c.id
      AND gm.campaign_id = cp.id
      AND gm.subject = 'Aicha, ready to turn pricing-page interest into pipeline?'
);