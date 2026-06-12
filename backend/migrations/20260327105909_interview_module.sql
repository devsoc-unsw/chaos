-- Add migration script here
CREATE TABLE availability (
    id SERIAL PRIMARY KEY,

    user_id INT NOT NULL,
    role_id INT NOT NULL,
    campaign_id INT NOT NULL,

    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_availability_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT fk_availability_role
        FOREIGN KEY (role_id) REFERENCES campaign_roles(id) ON DELETE RESTRICT,

    CONSTRAINT fk_availability_campaign
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,

    CONSTRAINT chk_availability_time
        CHECK (end_time > start_time),

    CONSTRAINT unique_user_availability
    UNIQUE (user_id, campaign_id, start_time, end_time)
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
    ON availability(campaign_id);

CREATE INDEX idx_availability_user
    ON availability(user_id);

CREATE INDEX idx_timeslots_campaign
    ON interview_timeslots(campaign_id);

CREATE INDEX idx_timeslot_users_user
    ON interview_timeslot_users(user_id);