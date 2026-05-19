/*
  Warnings:

  - You are about to drop the column `tokenHash` on the `Invitation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `Invitation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `Invitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `used` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Invitation_tokenHash_key";

-- AlterTable
ALTER TABLE "Invitation" DROP COLUMN "tokenHash",
ADD COLUMN     "token" TEXT NOT NULL,
ADD COLUMN     "used" BOOLEAN NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
