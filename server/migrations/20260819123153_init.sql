-- Add migration script here
CREATE TABLE campaigns
(
    campaign_id         BIGINT PRIMARY KEY,
    title               TEXT        NOT NULL,
    description         TEXT        NOT NULL,
    opening_date_time   TIMESTAMPTZ NOT NULL,
    closing_date_time   TIMESTAMPTZ NOT NULL,
    allow_role_overlaps BOOLEAN     NOT NULL,
    CONSTRAINT valid_campaign_dates
        CHECK (closing_date_time > opening_date_time)
);

CREATE TABLE campaign_roles
(
    role_id           BIGINT PRIMARY KEY,
    campaign_id       BIGINT  NOT NULL,
    title             TEXT    NOT NULL,
    description       TEXT    NOT NULL,
    no_of_positions   INT     NOT NULL,
    enable_abstention BOOLEAN NOT NULL,

    CONSTRAINT fk_campaign_roles_campaigns
        FOREIGN KEY (campaign_id)
            REFERENCES campaigns (campaign_id)
            ON DELETE CASCADE,
    CONSTRAINT valid_number_of_positions
        CHECK (no_of_positions > 0)

);

CREATE TABLE candidates
(
    candidate_id BIGINT PRIMARY KEY,
    campaign_id  BIGINT NOT NULL,
    first_name   TEXT   NOT NULL,
    last_name    TEXT   NOT NULL,
    email        TEXT   NOT NULL,
    manifesto    TEXT,

    CONSTRAINT fk_candidates_campaigns
        FOREIGN KEY (campaign_id)
            REFERENCES campaigns (campaign_id)
            ON DELETE CASCADE
);

CREATE TABLE nominations
(
    role_id      BIGINT NOT NULL,
    candidate_id BIGINT NOT NULL,

    CONSTRAINT pk_nominations
        PRIMARY KEY (role_id, candidate_id),

    CONSTRAINT fk_nominations_campaign_roles
        FOREIGN KEY (role_id)
            REFERENCES campaign_roles (role_id)
            ON DELETE CASCADE,

    CONSTRAINT fk_nominations_candidates
        FOREIGN KEY (candidate_id)
            REFERENCES candidates (candidate_id)
            ON DELETE CASCADE
);

CREATE TABLE campaign_voters
(
    voter_id     BIGINT PRIMARY KEY,
    campaign_id  BIGINT  NOT NULL,
    email        TEXT    NOT NULL,
    voting_token UUID    NOT NULL UNIQUE,
    has_voted    BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_campaign_voters_campaigns
        FOREIGN KEY (campaign_id)
            REFERENCES campaigns (campaign_id)
            ON DELETE CASCADE,

    CONSTRAINT uq_campaign_voters_email
        UNIQUE (campaign_id, email)
);

CREATE TABLE ballots
(
    ballot_id   BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,

    CONSTRAINT fk_ballots_campaigns
        FOREIGN KEY (campaign_id)
            REFERENCES campaigns (campaign_id)
            ON DELETE CASCADE
);

CREATE TABLE ballot_preferences
(
    ballot_id         BIGINT NOT NULL,
    role_id           BIGINT NOT NULL,
    candidate_id      BIGINT NOT NULL,
    preference_number INT    NOT NULL,

    CONSTRAINT pk_ballot_preferences
        PRIMARY KEY (ballot_id, role_id, preference_number),

    CONSTRAINT fk_ballot_preferences_ballots
        FOREIGN KEY (ballot_id)
            REFERENCES ballots (ballot_id)
            ON DELETE CASCADE,

    CONSTRAINT fk_ballot_preferences_nominations
        FOREIGN KEY (role_id, candidate_id)
            REFERENCES nominations (role_id, candidate_id)
            ON DELETE CASCADE,

    CONSTRAINT valid_preference_number
        CHECK (preference_number > 0)
);
