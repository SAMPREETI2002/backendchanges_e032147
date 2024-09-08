/*
  Warnings:

  - You are about to drop the column `description` on the `customerplan` table. All the data in the column will be lost.
  - Added the required column `description` to the `Plan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `customerplan` DROP COLUMN `description`;

-- AlterTable
ALTER TABLE `plan` ADD COLUMN `description` VARCHAR(191) NOT NULL;
