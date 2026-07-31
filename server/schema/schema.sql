CREATE TABLE campaign (
    campaign_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    opening_date_time TIMESTAMP NOT NULL,
    closing_date_time TIMESTAMP NOT NULL,
    allowed_role_overlaps BOOLEAN NOT NULL,
    CONSTRAINT valid_campaign_dates
        CHECK (closing_date_time > opening_date_time)
);

CREATE TABLE campaign_role (
    role_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    No_of_positions INT NOT NULL,
    Enable_Abstainment BOOLEAN NOT NULL,

    CONSTRAINT fk_campaign_role_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaign(campaign_id),
        CONSTRAINT valid_number_of_positions
        CHECK (no_of_positions > 0)

);

CREATE TABLE candidate (
    candidate_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    student_number VARCHAR(20) UNIQUE,
    manifesto TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE nomination (
    role_id BIGINT NOT NULL,
    candidate_id BIGINT NOT NULL,

    CONSTRAINT pk_nomination
        PRIMARY KEY (role_id, candidate_id),

    CONSTRAINT fk_nomination_role
        FOREIGN KEY (role_id)
        REFERENCES campaign_role(role_id),

    CONSTRAINT fk_nomination_candidate
        FOREIGN KEY (candidate_id)
        REFERENCES candidate(candidate_id)
);

CREATE TABLE campaign_voter (
    voter_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(30),
    voting_token UUID NOT NULL UNIQUE,
    has_voted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_campaign_voter_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaign(campaign_id),

    CONSTRAINT uq_campaign_voter_email
        UNIQUE (campaign_id, email)
);

CREATE TABLE ballot (
    ballot_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ballot_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES campaign(campaign_id)
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
        REFERENCES ballot(ballot_id),

    CONSTRAINT fk_ballot_preference_nomination
        FOREIGN KEY (role_id, candidate_id)
        REFERENCES nomination(role_id, candidate_id),

    CONSTRAINT valid_preference_number
        CHECK (preference_number > 0)
);