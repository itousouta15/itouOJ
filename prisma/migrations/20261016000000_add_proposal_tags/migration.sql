CREATE TABLE "ProposalTag" (
    "proposalId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    PRIMARY KEY ("proposalId", "tagId"),
    CONSTRAINT "ProposalTag_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "ProblemProposal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProposalTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
