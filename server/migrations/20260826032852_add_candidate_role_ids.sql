ALTER TABLE candidates ADD CONSTRAINT uq_candidates_campaign UNIQUE (candidate_id, campaign_id);

ALTER TABLE campaign_roles ADD CONSTRAINT uq_campaign_roles_campaign UNIQUE (role_id, campaign_id);

CREATE TABLE
    candidate_roles (
        candidate_id BIGINT NOT NULL,
        role_id BIGINT NOT NULL,
        campaign_id BIGINT NOT NULL,
        PRIMARY KEY (candidate_id, role_id),
        FOREIGN KEY (candidate_id, campaign_id) REFERENCES candidates (candidate_id, campaign_id) ON DELETE CASCADE,
        FOREIGN KEY (role_id, campaign_id) REFERENCES campaign_roles (role_id, campaign_id) ON DELETE CASCADE
    );
