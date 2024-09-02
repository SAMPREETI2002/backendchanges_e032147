-- AlterTable
ALTER TABLE `invoice` MODIFY `invoiceId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `plan` MODIFY `planId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `postpaidplan` MODIFY `id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `prepaidplan` MODIFY `id` INTEGER NOT NULL;
