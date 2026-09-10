-- CreateTable
CREATE TABLE "RecognitionClusterTag" (
    "clusterId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    PRIMARY KEY ("clusterId", "tagId"),
    CONSTRAINT "RecognitionClusterTag_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "RecognitionCluster" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecognitionClusterTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
