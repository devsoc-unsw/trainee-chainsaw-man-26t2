-- Add migration script here
CREATE TABLE campaign (
    campaign_id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    opening_date_time TIMESTAMPTZ NOT NULL,
    closing_date_time TIMESTAMPTZ NOT NULL,
    allowed_role_overlaps BOOLEAN NOT NULL,
    CONSTRAINT valid_campaign_dates
        CHECK (closing_date_time > opening_date_time)
);

CREATE TABLE campaign_role (
    role_id BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    no_of_positions INT NOT NULL,
    enable_abstention BOOLEAN NOT NULL,

    CONSTRAINT fk_campaign_role_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaign(campaign_id)
        ON DELETE CASCADE, 
    CONSTRAINT valid_number_of_positions
        CHECK (no_of_positions > 0)

);

CREATE TABLE candidate (
    candidate_id BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    manifesto TEXT,
    
    CONSTRAINT fk_candidate_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaign(campaign_id)
        ON DELETE CASCADE
);

CREATE TABLE nomination (
    role_id BIGINT NOT NULL,
    candidate_id BIGINT NOT NULL,

    CONSTRAINT pk_nomination
        PRIMARY KEY (role_id, candidate_id),

    CONSTRAINT fk_nomination_role
        FOREIGN KEY (role_id)
        REFERENCES campaign_role(role_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_nomination_candidate
        FOREIGN KEY (candidate_id)
        REFERENCES candidate(candidate_id)
        ON DELETE CASCADE
);

CREATE TABLE campaign_voter (
    voter_id BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    email TEXT NOT NULL,
    voting_token UUID NOT NULL UNIQUE,
    has_voted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_campaign_voter_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaign(campaign_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_campaign_voter_email
        UNIQUE (campaign_id, email)
);

CREATE TABLE ballot (
    ballot_id BIGINT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,

    CONSTRAINT fk_ballot_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaign(campaign_id)
        ON DELETE CASCADE
);

CREATE TABLE ballot_preference (
    ballot_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    candidate_id BIGINT NOT NULL,
    preference_number INT NOT NULL,

    CONSTRAINT pk_ballot_preference
        PRIMARY KEY (ballot_id, role_id, preference_number),

    CONSTRAINT fk_ballot_preference_ballot
        FOREIGN KEY (ballot_id)
        REFERENCES ballot(ballot_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ballot_preference_nomination
        FOREIGN KEY (role_id, candidate_id)
        REFERENCES nomination(role_id, candidate_id)
        ON DELETE CASCADE,

    CONSTRAINT valid_preference_number
        CHECK (preference_number > 0)
);
