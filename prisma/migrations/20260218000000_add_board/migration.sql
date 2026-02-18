-- CreateTable
CREATE TABLE "BoardPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BoardPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BoardPost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BoardPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BoardPost_parentId_idx" ON "BoardPost"("parentId");
CREATE INDEX "BoardPost_createdAt_idx" ON "BoardPost"("createdAt");

