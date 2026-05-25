CREATE TABLE "WhiteboardBoard" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteboardBoard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WhiteboardVisitor" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "browserId" VARCHAR(128) NOT NULL,
    "ipAddress" VARCHAR(64) NOT NULL,
    "displayName" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteboardVisitor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhiteboardBoard_slug_key" ON "WhiteboardBoard"("slug");
CREATE INDEX "WhiteboardBoard_createdAt_idx" ON "WhiteboardBoard"("createdAt");
CREATE UNIQUE INDEX "WhiteboardVisitor_boardId_browserId_key" ON "WhiteboardVisitor"("boardId", "browserId");
CREATE INDEX "WhiteboardVisitor_boardId_lastSeenAt_idx" ON "WhiteboardVisitor"("boardId", "lastSeenAt");
CREATE INDEX "WhiteboardVisitor_ipAddress_createdAt_idx" ON "WhiteboardVisitor"("ipAddress", "createdAt");
CREATE INDEX "WhiteboardVisitor_email_idx" ON "WhiteboardVisitor"("email");

ALTER TABLE "WhiteboardVisitor"
ADD CONSTRAINT "WhiteboardVisitor_boardId_fkey"
FOREIGN KEY ("boardId") REFERENCES "WhiteboardBoard"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
