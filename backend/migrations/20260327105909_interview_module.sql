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

CREATE TABLE interview_timeslots (
    id SERIAL PRIMARY KEY,

    campaign_id INT NOT NULL,

    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,

    location TEXT,
    description TEXT,
    booked BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_timeslot_campaign
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,

    CONSTRAINT chk_timeslot_time
        CHECK (end_time > start_time)
);

CREATE TABLE interview_timeslot_users (
    interview_timeslot_id INT NOT NULL,
    user_id INT NOT NULL,
    role_id INT NOT NULL,

    interviewer BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (interview_timeslot_id, user_id),

    CONSTRAINT fk_timeslot_user_timeslot
        FOREIGN KEY (interview_timeslot_id)
        REFERENCES interview_timeslots(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_timeslot_user_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_timeslot_user_role
        FOREIGN KEY (role_id)
        REFERENCES campaign_roles(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_availability_campaign
    ON user_campaign_availabilities(campaign_id);

CREATE INDEX idx_availability_user
    ON user_campaign_availabilities(user_id);

CREATE INDEX idx_timeslots_campaign
    ON interview_timeslots(campaign_id);

CREATE INDEX idx_timeslot_users_user
    ON interview_timeslot_users(user_id);
