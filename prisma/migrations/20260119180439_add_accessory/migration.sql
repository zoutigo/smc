/*
  Warnings:

  - You are about to drop the column `quantity` on the `PackagingMean` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `PackagingMeanPart` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `PackagingMean` DROP COLUMN `quantity`,
    ADD COLUMN `numberOfPackagings` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `PackagingMeanPart` DROP COLUMN `quantity`,
    ADD COLUMN `horizontalPitch` INTEGER NULL,
    ADD COLUMN `levelsPerPackaging` INTEGER NULL,
    ADD COLUMN `partsPerPackaging` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `verticalPitch` INTEGER NULL;

-- CreateTable
CREATE TABLE `Accessory` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `plantId` CHAR(36) NOT NULL,
    `supplierId` CHAR(36) NULL,
    `unitPrice` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Accessory_plantId_idx`(`plantId`),
    INDEX `Accessory_supplierId_idx`(`supplierId`),
    UNIQUE INDEX `Accessory_plantId_slug_key`(`plantId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartAccessory` (
    `partId` CHAR(36) NOT NULL,
    `accessoryId` CHAR(36) NOT NULL,
    `qtyPerPart` INTEGER NOT NULL DEFAULT 1,
    `notes` VARCHAR(191) NULL,

    PRIMARY KEY (`partId`, `accessoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PackagingMeanAccessory` (
    `packagingMeanId` CHAR(36) NOT NULL,
    `accessoryId` CHAR(36) NOT NULL,
    `qtyPerPackaging` INTEGER NOT NULL DEFAULT 1,
    `unitPriceOverride` INTEGER NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `PackagingMeanAccessory_accessoryId_idx`(`accessoryId`),
    PRIMARY KEY (`packagingMeanId`, `accessoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Accessory` ADD CONSTRAINT `Accessory_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Accessory` ADD CONSTRAINT `Accessory_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartAccessory` ADD CONSTRAINT `PartAccessory_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartAccessory` ADD CONSTRAINT `PartAccessory_accessoryId_fkey` FOREIGN KEY (`accessoryId`) REFERENCES `Accessory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMeanAccessory` ADD CONSTRAINT `PackagingMeanAccessory_packagingMeanId_fkey` FOREIGN KEY (`packagingMeanId`) REFERENCES `PackagingMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMeanAccessory` ADD CONSTRAINT `PackagingMeanAccessory_accessoryId_fkey` FOREIGN KEY (`accessoryId`) REFERENCES `Accessory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
