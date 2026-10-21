/*
  Warnings:

  - A unique constraint covering the columns `[studentId,repoUrl]` on the table `submissions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "submissions_studentId_repoUrl_key" ON "submissions"("studentId", "repoUrl");
