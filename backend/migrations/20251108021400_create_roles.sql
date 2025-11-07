CREATE TABLE role_interview_settings (
    role_id BIGINT PRIMARY KEY,
    min_num_interviewers INTEGER NOT NULL CHECK (min_num_interviewers > 0),
    first_class_requirement TEXT NOT NULL CHECK (first_class_requirement IN ('all', 'one_of')),
    interview_duration_minutes SMALLINT NOT NULL CHECK (interview_duration_minutes IN (30, 60)),
    CONSTRAINT FK_role_interview_settings_role
        FOREIGN KEY(role_id)
            REFERENCES campaign_roles(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
);