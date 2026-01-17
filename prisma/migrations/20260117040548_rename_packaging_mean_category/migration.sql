/*
  Warnings:

  - You are about to drop the column `packagingCategoryId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the `PackagingCategory` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[packagingMeanCategoryId]` on the table `Image` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Image` DROP FOREIGN KEY `Image_packagingCategoryId_fkey`;

-- DropIndex
DROP INDEX `Image_packagingCategoryId_key` ON `Image`;

-- AlterTable
ALTER TABLE `Image` DROP COLUMN `packagingCategoryId`,
    ADD COLUMN `packagingMeanCategoryId` CHAR(36) NULL;

-- DropTable
DROP TABLE `PackagingCategory`;

-- CreateTable
CREATE TABLE `PackagingMeanCategory` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'Description of packaging category',
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PackagingMeanCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Image_packagingMeanCategoryId_key` ON `Image`(`packagingMeanCategoryId`);

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_packagingMeanCategoryId_fkey` FOREIGN KEY (`packagingMeanCategoryId`) REFERENCES `PackagingMeanCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
