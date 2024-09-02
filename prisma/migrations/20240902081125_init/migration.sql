/*
  Warnings:

  - Added the required column `amount` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planType` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitsUsed` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `invoice` ADD COLUMN `amount` DOUBLE NOT NULL,
    ADD COLUMN `customerName` VARCHAR(191) NOT NULL,
    ADD COLUMN `date` DATETIME(3) NOT NULL,
    ADD COLUMN `planId` INTEGER NOT NULL,
    ADD COLUMN `planType` ENUM('PREPAID', 'POSTPAID') NOT NULL,
    ADD COLUMN `unitsUsed` INTEGER NOT NULL,
    MODIFY `invoiceId` INTEGER NOT NULL AUTO_INCREMENT;

-- CreateTable
CREATE TABLE `Plan` (
    `planId` INTEGER NOT NULL AUTO_INCREMENT,
    `planName` VARCHAR(191) NOT NULL,
    `ratePerUnit` DOUBLE NOT NULL,

    PRIMARY KEY (`planId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PrepaidPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planId` INTEGER NOT NULL,
    `prepaidBalance` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PostpaidPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `planId` INTEGER NOT NULL,
    `billingCycle` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PrepaidPlan` ADD CONSTRAINT `PrepaidPlan_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`planId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PostpaidPlan` ADD CONSTRAINT `PostpaidPlan_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`planId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`planId`) ON DELETE RESTRICT ON UPDATE CASCADE;
