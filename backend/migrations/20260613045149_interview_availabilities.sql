-- Add migration script here
CREATE TABLE user_campaign_availabilities (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE TABLE availability_slots (
  id SERIAL PRIMARY KEY,
  availability_id BIGINT NOT NULL REFERENCES user_campaign_availabilities(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  UNIQUE (availability_id, start_time)
);

CREATE INDEX idx_user_campaign_availabilities
    ON user_campaign_availabilities(user_id)

CREATE INDEX idx_user_campaign_availabilities
    ON user_campaign_availabilities(campaign_id)

CREATE INDEX idx_availability_slots
    ON availability_slots(availability_id)

CREATE INDEX idx_availability_slots
    ON availability_slots(start_time)
