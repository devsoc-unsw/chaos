-- represents ports or exec teams
CREATE TABLE ambush_teams (
    id BIGINT PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_ambush_teams_organisation FOREIGN KEY(organisation_id) REFERENCES organisations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (organisation_id, name)
);

-- roles which are created in ambush, so things like chaos director or chaos subcom can be modelled
CREATE TABLE ambush_roles (
    id BIGINT PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_ambush_roles_organisation FOREIGN KEY(organisation_id) REFERENCES organisations(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (organisation_id, name)
);

-- team role pivot table, roles HAVE to be part of teams, so we've decided to use a pivot table here
CREATE TABLE ambush_team_roles (
    id BIGINT PRIMARY KEY,
    team_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    CONSTRAINT FK_ambush_team_roles_team FOREIGN KEY(team_id) REFERENCES ambush_teams(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT FK_ambush_team_roles_role FOREIGN KEY(role_id) REFERENCES ambush_roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (team_id, role_id)
);

-- team membership pivot table, basically says that x user is in y team as a z
CREATE TABLE ambush_team_memberships (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    team_role_id BIGINT NOT NULL,
    CONSTRAINT FK_ambush_team_memberships_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT FK_ambush_team_memberships_team_role FOREIGN KEY(team_role_id) REFERENCES ambush_team_roles(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IDX_ambush_teams_organisation on ambush_teams(organisation_id);
CREATE INDEX IDX_ambush_roles_organisation on ambush_roles(organisation_id);
CREATE INDEX IDX_ambush_team_roles_team on ambush_team_roles(team_id);
CREATE INDEX IDX_ambush_team_roles_role on ambush_team_roles(role_id);
CREATE INDEX IDX_ambush_team_memberships_user on ambush_team_memberships(user_id);
CREATE INDEX IDX_ambush_team_memberships_team_role on ambush_team_memberships(team_role_id);

-- js wipe everything to do with referencing roles
TRUNCATE campaign_roles CASCADE;

-- Keep role hiring here, but names and ids should now come from team roles. I'm keeping descriptions here for now because it's not modelled in ambush
-- and I feel like campaigns might want to specify different reasons for hiring in each description (like to signify FE only or smth like that)
ALTER TABLE campaign_roles
    DROP COLUMN name,
    DROP COLUMN finalised,
    ADD COLUMN ambush_team_role_id BIGINT NOT NULL,
    ADD CONSTRAINT FK_campaign_roles_ambush_team_role FOREIGN KEY(ambush_team_role_id) REFERENCES ambush_team_roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT UQ_campaign_roles_campaign_ambush_team_role UNIQUE (campaign_id, ambush_team_role_id);

CREATE INDEX IDX_campaign_roles_ambush_team_role on campaign_roles(ambush_team_role_id);
