/*
  Warnings:

  - A unique constraint covering the columns `[projectId,slug]` on the table `Part` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Part_slug_key` ON `Part`;

-- CreateTable
CREATE TABLE `PackagingMean` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `width` INTEGER NOT NULL,
    `length` INTEGER NOT NULL,
    `height` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',
    `sop` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eop` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `supplierId` CHAR(36) NULL,
    `plantId` CHAR(36) NOT NULL,
    `flowId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `packagingMeanCategoryId` CHAR(36) NOT NULL,

    INDEX `PackagingMean_plantId_idx`(`plantId`),
    INDEX `PackagingMean_flowId_idx`(`flowId`),
    UNIQUE INDEX `PackagingMean_plantId_name_packagingMeanCategoryId_key`(`plantId`, `name`, `packagingMeanCategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PackagingMeanPart` (
    `packagingMeanId` CHAR(36) NOT NULL,
    `partId` CHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `notes` VARCHAR(191) NULL,

    INDEX `PackagingMeanPart_partId_idx`(`partId`),
    INDEX `PackagingMeanPart_packagingMeanId_idx`(`packagingMeanId`),
    PRIMARY KEY (`packagingMeanId`, `partId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PackagingMeanImage` (
    `packagingMeanId` CHAR(36) NOT NULL,
    `imageId` CHAR(36) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `PackagingMeanImage_imageId_idx`(`imageId`),
    INDEX `PackagingMeanImage_packagingMeanId_sortOrder_idx`(`packagingMeanId`, `sortOrder`),
    PRIMARY KEY (`packagingMeanId`, `imageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Part_projectId_slug_key` ON `Part`(`projectId`, `slug`);

-- AddForeignKey
ALTER TABLE `PackagingMean` ADD CONSTRAINT `PackagingMean_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMean` ADD CONSTRAINT `PackagingMean_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMean` ADD CONSTRAINT `PackagingMean_flowId_fkey` FOREIGN KEY (`flowId`) REFERENCES `Flow`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMean` ADD CONSTRAINT `PackagingMean_packagingMeanCategoryId_fkey` FOREIGN KEY (`packagingMeanCategoryId`) REFERENCES `PackagingMeanCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMeanPart` ADD CONSTRAINT `PackagingMeanPart_packagingMeanId_fkey` FOREIGN KEY (`packagingMeanId`) REFERENCES `PackagingMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMeanPart` ADD CONSTRAINT `PackagingMeanPart_partId_fkey` FOREIGN KEY (`partId`) REFERENCES `Part`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMeanImage` ADD CONSTRAINT `PackagingMeanImage_packagingMeanId_fkey` FOREIGN KEY (`packagingMeanId`) REFERENCES `PackagingMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMeanImage` ADD CONSTRAINT `PackagingMeanImage_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
