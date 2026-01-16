/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `PackagingCategory` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Plant` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `StorageMeanCategory` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Supplier` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[packagingCategoryId]` on the table `Image` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[storageMeanCategoryId]` on the table `Image` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Image` ADD COLUMN `packagingCategoryId` CHAR(36) NULL,
    ADD COLUMN `plantId` CHAR(36) NULL,
    ADD COLUMN `storageMeanCategoryId` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `PackagingCategory` DROP COLUMN `imageUrl`;

-- AlterTable
ALTER TABLE `Plant` DROP COLUMN `image`;

-- AlterTable
ALTER TABLE `StorageMeanCategory` DROP COLUMN `imageUrl`;

-- AlterTable
ALTER TABLE `Supplier` DROP COLUMN `image`;

-- CreateIndex
CREATE UNIQUE INDEX `Image_packagingCategoryId_key` ON `Image`(`packagingCategoryId`);

-- CreateIndex
CREATE UNIQUE INDEX `Image_storageMeanCategoryId_key` ON `Image`(`storageMeanCategoryId`);

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_packagingCategoryId_fkey` FOREIGN KEY (`packagingCategoryId`) REFERENCES `PackagingCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_storageMeanCategoryId_fkey` FOREIGN KEY (`storageMeanCategoryId`) REFERENCES `StorageMeanCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
