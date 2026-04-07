/*
  Warnings:

  - You are about to drop the column `predictedAwayScore` on the `Prediction` table. All the data in the column will be lost.
  - You are about to drop the column `predictedHomeScore` on the `Prediction` table. All the data in the column will be lost.
  - Added the required column `predictedWinner` to the `Prediction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Prediction" DROP COLUMN "predictedAwayScore",
DROP COLUMN "predictedHomeScore",
ADD COLUMN     "predictedWinner" TEXT NOT NULL;
