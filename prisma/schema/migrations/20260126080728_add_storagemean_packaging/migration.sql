-- CreateTable
CREATE TABLE `StorageMeanPackagingMean` (
    `storageMeanId` CHAR(36) NOT NULL,
    `packagingMeanId` CHAR(36) NOT NULL,
    `qty` INTEGER NOT NULL DEFAULT 0,
    `maxQty` INTEGER NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `StorageMeanPackagingMean_packagingMeanId_idx`(`packagingMeanId`),
    INDEX `StorageMeanPackagingMean_storageMeanId_idx`(`storageMeanId`),
    PRIMARY KEY (`storageMeanId`, `packagingMeanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StorageMeanPackagingMean` ADD CONSTRAINT `StorageMeanPackagingMean_storageMeanId_fkey` FOREIGN KEY (`storageMeanId`) REFERENCES `StorageMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanPackagingMean` ADD CONSTRAINT `StorageMeanPackagingMean_packagingMeanId_fkey` FOREIGN KEY (`packagingMeanId`) REFERENCES `PackagingMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
