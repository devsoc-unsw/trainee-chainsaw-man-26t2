CREATE TABLE users
(
    user_id BIGINT PRIMARY KEY,
    email   TEXT UNIQUE
);

CREATE TABLE user_identities
(
    provider    TEXT   NOT NULL,
    provider_id TEXT   NOT NULL,
    user_id     BIGINT NOT NULL,

    CONSTRAINT pk_user_identities
        PRIMARY KEY (provider, provider_id),

    CONSTRAINT fk_user_identities_users
        FOREIGN KEY (user_id)
            REFERENCES users (user_id)
            ON DELETE CASCADE
);
