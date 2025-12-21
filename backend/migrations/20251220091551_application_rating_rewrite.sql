-- Add migration script here

-- campaign_rating_categories (NEW TABLE)
CREATE TABLE campaign_rating_categories (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    campaign_id BIGINT NOT NULL,
    CONSTRAINT FK_campaign_categories
      FOREIGN KEY(campaign_id)
          REFERENCES campaigns(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
);

CREATE INDEX IDX_campaign_rating_categories_campaign ON campaign_rating_categories(campaign_id);


-- application_ratings (EXISTING TABLE)
ALTER TABLE application_ratings
DROP COLUMN rating; 

ALTER TABLE application_ratings
ADD CONSTRAINT UQ_application_ratings_application_rater,
UNIQUE(application_id, rater_id);

-- application_rating_category_rating (NEW TABLE)
CREATE TABLE application_rating_category_rating (
    id BIGINT PRIMARY KEY,
    application_rating_id BIGINT NOT NULL,
    campaign_rating_category_id BIGINT NOT NULL,
    rating INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT FK_rating_applications
      FOREIGN KEY(application_rating_id)
          REFERENCES application_ratings(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
    CONSTRAINT FK_campaign_rating_category
      FOREIGN KEY(campaign_rating_category_id)
          REFERENCES campaign_rating_categories(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
);

CREATE INDEX IDX_application_rating_category_rating_application_rating ON application_rating_category_rating(application_rating_id);
CREATE INDEX IDX_application_rating_category_rating_campaign_rating_category ON application_rating_category_rating(campaign_rating_category_id);
