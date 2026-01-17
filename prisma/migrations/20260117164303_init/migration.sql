-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `birthDate` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageMean` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',
    `sop` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eop` DATETIME(3) NOT NULL DEFAULT DATE_ADD(NOW(), INTERVAL 10 YEAR),
    `supplierId` CHAR(36) NULL,
    `plantId` CHAR(36) NOT NULL,
    `flowId` CHAR(36) NULL,
    `storageMeanCategoryId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageMean_plantId_idx`(`plantId`),
    INDEX `StorageMean_storageMeanCategoryId_idx`(`storageMeanCategoryId`),
    UNIQUE INDEX `StorageMean_plantId_name_storageMeanCategoryId_key`(`plantId`, `name`, `storageMeanCategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Plant` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `addressId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Supplier` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `addressId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` CHAR(36) NOT NULL,
    `street` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `zipcode` VARCHAR(191) NULL,
    `countryId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Country` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` CHAR(5) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `sop` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eop` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Project_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartFamily` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'Bumper',
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PartFamily_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Part` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'Front Bumper Upper',
    `slug` VARCHAR(191) NOT NULL,
    `partFamilyId` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Part_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Image` (
    `id` CHAR(36) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageMeanImage` (
    `storageMeanId` CHAR(36) NOT NULL,
    `imageId` CHAR(36) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `StorageMeanImage_imageId_idx`(`imageId`),
    INDEX `StorageMeanImage_storageMeanId_sortOrder_idx`(`storageMeanId`, `sortOrder`),
    PRIMARY KEY (`storageMeanId`, `imageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlantImage` (
    `plantId` CHAR(36) NOT NULL,
    `imageId` CHAR(36) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `PlantImage_imageId_idx`(`imageId`),
    INDEX `PlantImage_plantId_sortOrder_idx`(`plantId`, `sortOrder`),
    PRIMARY KEY (`plantId`, `imageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageMeanCategoryImage` (
    `storageMeanCategoryId` CHAR(36) NOT NULL,
    `imageId` CHAR(36) NOT NULL,

    UNIQUE INDEX `StorageMeanCategoryImage_storageMeanCategoryId_key`(`storageMeanCategoryId`),
    UNIQUE INDEX `StorageMeanCategoryImage_imageId_key`(`imageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PackagingMeanCategoryImage` (
    `packagingMeanCategoryId` CHAR(36) NOT NULL,
    `imageId` CHAR(36) NOT NULL,

    UNIQUE INDEX `PackagingMeanCategoryImage_packagingMeanCategoryId_key`(`packagingMeanCategoryId`),
    UNIQUE INDEX `PackagingMeanCategoryImage_imageId_key`(`imageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Flow` (
    `id` CHAR(36) NOT NULL,
    `from` ENUM('INJECTION', 'PAINT', 'ASSEMBLY', 'BONDING', 'INSPECTION', 'SILS', 'CUSTOMER', 'WAREHOUSE') NOT NULL DEFAULT 'INJECTION',
    `to` ENUM('INJECTION', 'PAINT', 'ASSEMBLY', 'BONDING', 'INSPECTION', 'SILS', 'CUSTOMER', 'WAREHOUSE') NOT NULL DEFAULT 'PAINT',
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Flow_slug_key`(`slug`),
    UNIQUE INDEX `Flow_from_to_key`(`from`, `to`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageMeanCategory` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'Description of storage mean category',
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StorageMeanCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `Lane` (
    `id` CHAR(36) NOT NULL,
    `length` INTEGER NOT NULL DEFAULT 0,
    `width` INTEGER NOT NULL DEFAULT 0,
    `height` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Lane_length_width_height_key`(`length`, `width`, `height`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageMeanManualTranstocker` (
    `storageMeanId` CHAR(36) NOT NULL,
    `emptyReturnLanes` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`storageMeanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageMeanAutoTranstocker` (
    `storageMeanId` CHAR(36) NOT NULL,
    `emptyReturnLanes` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`storageMeanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageMeanManualTranstockerLane` (
    `transtockerId` CHAR(36) NOT NULL,
    `laneId` CHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,

    INDEX `StorageMeanManualTranstockerLane_laneId_idx`(`laneId`),
    PRIMARY KEY (`transtockerId`, `laneId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageMeanAutoTranstockerLane` (
    `transtockerId` CHAR(36) NOT NULL,
    `laneId` CHAR(36) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,

    INDEX `StorageMeanAutoTranstockerLane_laneId_idx`(`laneId`),
    PRIMARY KEY (`transtockerId`, `laneId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,
    `refresh_token_expires_in` INTEGER NULL,

    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` CHAR(36) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `id` CHAR(36) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StorageMean` ADD CONSTRAINT `StorageMean_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMean` ADD CONSTRAINT `StorageMean_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMean` ADD CONSTRAINT `StorageMean_flowId_fkey` FOREIGN KEY (`flowId`) REFERENCES `Flow`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMean` ADD CONSTRAINT `StorageMean_storageMeanCategoryId_fkey` FOREIGN KEY (`storageMeanCategoryId`) REFERENCES `StorageMeanCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Plant` ADD CONSTRAINT `Plant_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Supplier` ADD CONSTRAINT `Supplier_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Part` ADD CONSTRAINT `Part_partFamilyId_fkey` FOREIGN KEY (`partFamilyId`) REFERENCES `PartFamily`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Part` ADD CONSTRAINT `Part_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanImage` ADD CONSTRAINT `StorageMeanImage_storageMeanId_fkey` FOREIGN KEY (`storageMeanId`) REFERENCES `StorageMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanImage` ADD CONSTRAINT `StorageMeanImage_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlantImage` ADD CONSTRAINT `PlantImage_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlantImage` ADD CONSTRAINT `PlantImage_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanCategoryImage` ADD CONSTRAINT `StorageMeanCategoryImage_storageMeanCategoryId_fkey` FOREIGN KEY (`storageMeanCategoryId`) REFERENCES `StorageMeanCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanCategoryImage` ADD CONSTRAINT `StorageMeanCategoryImage_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMeanCategoryImage` ADD CONSTRAINT `PackagingMeanCategoryImage_packagingMeanCategoryId_fkey` FOREIGN KEY (`packagingMeanCategoryId`) REFERENCES `PackagingMeanCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMeanCategoryImage` ADD CONSTRAINT `PackagingMeanCategoryImage_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanManualTranstocker` ADD CONSTRAINT `StorageMeanManualTranstocker_storageMeanId_fkey` FOREIGN KEY (`storageMeanId`) REFERENCES `StorageMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanAutoTranstocker` ADD CONSTRAINT `StorageMeanAutoTranstocker_storageMeanId_fkey` FOREIGN KEY (`storageMeanId`) REFERENCES `StorageMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanManualTranstockerLane` ADD CONSTRAINT `StorageMeanManualTranstockerLane_transtockerId_fkey` FOREIGN KEY (`transtockerId`) REFERENCES `StorageMeanManualTranstocker`(`storageMeanId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanManualTranstockerLane` ADD CONSTRAINT `StorageMeanManualTranstockerLane_laneId_fkey` FOREIGN KEY (`laneId`) REFERENCES `Lane`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanAutoTranstockerLane` ADD CONSTRAINT `StorageMeanAutoTranstockerLane_transtockerId_fkey` FOREIGN KEY (`transtockerId`) REFERENCES `StorageMeanAutoTranstocker`(`storageMeanId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanAutoTranstockerLane` ADD CONSTRAINT `StorageMeanAutoTranstockerLane_laneId_fkey` FOREIGN KEY (`laneId`) REFERENCES `Lane`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
