CREATE TABLE teams (
    id BIGINT PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_teams_organisation FOREIGN KEY(organisation_id) REFERENCES organisations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (organisation_id, name)
);

CREATE TABLE team_memberships (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_team_memberships_team FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT FK_team_memberships_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (team_id, user_id)
);

CREATE INDEX IDX_teams_organisation on teams(organisation_id);
CREATE INDEX IDX_team_memberships_team on team_memberships(team_id);
CREATE INDEX IDX_team_memberships_user on team_memberships(user_id);

-- js wipe everything to do with referencing roles
TRUNCATE campaign_roles CASCADE;

-- Keep role hiring here, but names and ids should now come from teams. I'm keeping descriptions here for now because it's not modelled in ambush
-- and I feel like campaigns might want to specify different reasons for hiring in each description (like to signify FE only or smth like that)
ALTER TABLE campaign_roles
    DROP COLUMN name,
    DROP COLUMN finalised,
    ADD COLUMN team_id BIGINT NOT NULL,
    ADD CONSTRAINT FK_campaign_roles_team FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT UQ_campaign_roles_campaign_team UNIQUE (campaign_id, team_id);

CREATE INDEX IDX_campaign_roles_team on campaign_roles(team_id);
