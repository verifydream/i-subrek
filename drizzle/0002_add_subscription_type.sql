-- Add subscription_type enum
CREATE TYPE subscription_type AS ENUM ('trial', 'voucher', 'subscription');

-- Add subscription_type column to subscriptions table with default 'trial'
ALTER TABLE subscriptions ADD COLUMN subscription_type subscription_type NOT NULL DEFAULT 'trial';
