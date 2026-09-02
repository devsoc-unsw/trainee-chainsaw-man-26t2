ALTER TABLE "campaign_voters"
ALTER COLUMN "voting_token"
DROP NOT NULL;

ALTER TABLE "campaign_voters"
ALTER COLUMN "voting_token"
SET DEFAULT NULL;
