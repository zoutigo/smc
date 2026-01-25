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
CREATE TABLE `StorageMean` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',
    `sop` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eop` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `heightMm` INTEGER NOT NULL DEFAULT 0,
    `usefulSurfaceM2` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `grossSurfaceM2` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `supplierId` CHAR(36) NULL,
    `plantId` CHAR(36) NOT NULL,
    `storageMeanCategoryId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StorageMean_plantId_idx`(`plantId`),
    INDEX `StorageMean_storageMeanCategoryId_idx`(`storageMeanCategoryId`),
    UNIQUE INDEX `StorageMean_plantId_name_storageMeanCategoryId_key`(`plantId`, `name`, `storageMeanCategoryId`),
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
CREATE TABLE `Lane` (
    `id` CHAR(36) NOT NULL,
    `laneGroupId` CHAR(36) NOT NULL,
    `lengthMm` INTEGER NOT NULL DEFAULT 0,
    `widthMm` INTEGER NOT NULL DEFAULT 0,
    `heightMm` INTEGER NOT NULL DEFAULT 0,
    `numberOfLanes` INTEGER NOT NULL DEFAULT 1,
    `level` INTEGER NOT NULL DEFAULT 0,
    `laneType` ENUM('EMPTIES', 'ACCUMULATION', 'EMPTIES_AND_ACCUMULATION') NOT NULL DEFAULT 'ACCUMULATION',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Lane_laneGroupId_idx`(`laneGroupId`),
    INDEX `Lane_laneGroupId_level_idx`(`laneGroupId`, `level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LaneGroup` (
    `id` CHAR(36) NOT NULL,
    `storageMeanId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LaneGroup_storageMeanId_idx`(`storageMeanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HighBayRackSpec` (
    `storageMeanId` CHAR(36) NOT NULL,
    `numberOfLevels` INTEGER NOT NULL DEFAULT 0,
    `numberOfBays` INTEGER NOT NULL DEFAULT 0,
    `slotLengthMm` INTEGER NOT NULL DEFAULT 0,
    `slotWidthMm` INTEGER NOT NULL DEFAULT 0,
    `slotHeightMm` INTEGER NOT NULL DEFAULT 0,
    `numberOfSlots` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`storageMeanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StorageMeanFlow` (
    `storageMeanId` CHAR(36) NOT NULL,
    `flowId` CHAR(36) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NULL,

    INDEX `StorageMeanFlow_flowId_idx`(`flowId`),
    INDEX `StorageMeanFlow_storageMeanId_sortOrder_idx`(`storageMeanId`, `sortOrder`),
    PRIMARY KEY (`storageMeanId`, `flowId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffingLine` (
    `id` CHAR(36) NOT NULL,
    `storageMeanId` CHAR(36) NOT NULL,
    `shift` ENUM('SHIFT_1', 'SHIFT_2', 'SHIFT_3') NOT NULL,
    `workforceType` ENUM('DIRECT', 'INDIRECT') NOT NULL,
    `qty` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `role` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StaffingLine_storageMeanId_idx`(`storageMeanId`),
    INDEX `StaffingLine_storageMeanId_shift_idx`(`storageMeanId`, `shift`),
    INDEX `StaffingLine_storageMeanId_workforceType_idx`(`storageMeanId`, `workforceType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PackagingMean` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `width` INTEGER NOT NULL,
    `length` INTEGER NOT NULL,
    `height` INTEGER NOT NULL,
    `numberOfPackagings` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('ACTIVE', 'INACTIVE', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',
    `sop` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eop` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `supplierId` CHAR(36) NULL,
    `plantId` CHAR(36) NOT NULL,
    `flowId` CHAR(36) NULL,
    `packagingMeanCategoryId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PackagingMean_plantId_idx`(`plantId`),
    INDEX `PackagingMean_flowId_idx`(`flowId`),
    UNIQUE INDEX `PackagingMean_plantId_name_packagingMeanCategoryId_key`(`plantId`, `name`, `packagingMeanCategoryId`),
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
CREATE TABLE `PackagingMeanPart` (
    `packagingMeanId` CHAR(36) NOT NULL,
    `partId` CHAR(36) NOT NULL,
    `partsPerPackaging` INTEGER NOT NULL DEFAULT 1,
    `levelsPerPackaging` INTEGER NULL,
    `verticalPitch` INTEGER NULL,
    `horizontalPitch` INTEGER NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `PackagingMeanPart_partId_idx`(`partId`),
    INDEX `PackagingMeanPart_packagingMeanId_idx`(`packagingMeanId`),
    PRIMARY KEY (`packagingMeanId`, `partId`)
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
    `projectId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Part_projectId_slug_key`(`projectId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
CREATE TABLE `PackagingMeanImage` (
    `packagingMeanId` CHAR(36) NOT NULL,
    `imageId` CHAR(36) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `PackagingMeanImage_imageId_idx`(`imageId`),
    INDEX `PackagingMeanImage_packagingMeanId_sortOrder_idx`(`packagingMeanId`, `sortOrder`),
    PRIMARY KEY (`packagingMeanId`, `imageId`)
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
CREATE TABLE `Note` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `authorId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NoteLink` (
    `id` CHAR(36) NOT NULL,
    `noteId` CHAR(36) NOT NULL,
    `targetType` ENUM('STORAGE_MEAN', 'PACKAGING_MEAN', 'TRANSPORT_MEAN') NOT NULL,
    `targetId` CHAR(36) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NoteLink_targetType_targetId_idx`(`targetType`, `targetId`),
    INDEX `NoteLink_noteId_idx`(`noteId`),
    UNIQUE INDEX `NoteLink_noteId_targetType_targetId_key`(`noteId`, `targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportMean` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `transportMeanCategoryId` VARCHAR(191) NOT NULL,
    `plantId` CHAR(36) NOT NULL,
    `supplierId` CHAR(36) NULL,
    `loadCapacityKg` INTEGER NOT NULL DEFAULT 0,
    `units` INTEGER NOT NULL DEFAULT 1,
    `cruiseSpeedKmh` INTEGER NOT NULL DEFAULT 0,
    `maxSpeedKmh` INTEGER NOT NULL DEFAULT 0,
    `sop` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eop` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TransportMean_slug_key`(`slug`),
    INDEX `TransportMean_transportMeanCategoryId_idx`(`transportMeanCategoryId`),
    INDEX `TransportMean_plantId_idx`(`plantId`),
    INDEX `TransportMean_supplierId_idx`(`supplierId`),
    UNIQUE INDEX `TransportMean_plantId_slug_key`(`plantId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportMeanImage` (
    `transportMeanId` CHAR(36) NOT NULL,
    `imageId` CHAR(36) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `TransportMeanImage_imageId_idx`(`imageId`),
    INDEX `TransportMeanImage_transportMeanId_sortOrder_idx`(`transportMeanId`, `sortOrder`),
    PRIMARY KEY (`transportMeanId`, `imageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportMeanCategory` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TransportMeanCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportMeanCategoryImage` (
    `transportMeanCategoryId` CHAR(36) NOT NULL,
    `imageId` CHAR(36) NOT NULL,

    UNIQUE INDEX `TransportMeanCategoryImage_transportMeanCategoryId_key`(`transportMeanCategoryId`),
    UNIQUE INDEX `TransportMeanCategoryImage_imageId_key`(`imageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportMeanPackagingMean` (
    `transportMeanId` CHAR(36) NOT NULL,
    `packagingMeanId` CHAR(36) NOT NULL,
    `maxQty` INTEGER NOT NULL DEFAULT 1,
    `notes` VARCHAR(191) NULL,
    `packagingMeanPartPackagingMeanId` CHAR(36) NULL,
    `packagingMeanPartPartId` CHAR(36) NULL,

    INDEX `TransportMeanPackagingMean_packagingMeanId_idx`(`packagingMeanId`),
    PRIMARY KEY (`transportMeanId`, `packagingMeanId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportMeanFlow` (
    `transportMeanId` CHAR(36) NOT NULL,
    `flowId` CHAR(36) NOT NULL,

    INDEX `TransportMeanFlow_flowId_idx`(`flowId`),
    INDEX `TransportMeanFlow_transportMeanId_idx`(`transportMeanId`),
    PRIMARY KEY (`transportMeanId`, `flowId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Plant` ADD CONSTRAINT `Plant_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Supplier` ADD CONSTRAINT `Supplier_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMean` ADD CONSTRAINT `StorageMean_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMean` ADD CONSTRAINT `StorageMean_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMean` ADD CONSTRAINT `StorageMean_storageMeanCategoryId_fkey` FOREIGN KEY (`storageMeanCategoryId`) REFERENCES `StorageMeanCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lane` ADD CONSTRAINT `Lane_laneGroupId_fkey` FOREIGN KEY (`laneGroupId`) REFERENCES `LaneGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LaneGroup` ADD CONSTRAINT `LaneGroup_storageMeanId_fkey` FOREIGN KEY (`storageMeanId`) REFERENCES `StorageMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HighBayRackSpec` ADD CONSTRAINT `HighBayRackSpec_storageMeanId_fkey` FOREIGN KEY (`storageMeanId`) REFERENCES `StorageMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanFlow` ADD CONSTRAINT `StorageMeanFlow_storageMeanId_fkey` FOREIGN KEY (`storageMeanId`) REFERENCES `StorageMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanFlow` ADD CONSTRAINT `StorageMeanFlow_flowId_fkey` FOREIGN KEY (`flowId`) REFERENCES `Flow`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffingLine` ADD CONSTRAINT `StaffingLine_storageMeanId_fkey` FOREIGN KEY (`storageMeanId`) REFERENCES `StorageMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE `Part` ADD CONSTRAINT `Part_partFamilyId_fkey` FOREIGN KEY (`partFamilyId`) REFERENCES `PartFamily`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Part` ADD CONSTRAINT `Part_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE `StorageMeanImage` ADD CONSTRAINT `StorageMeanImage_storageMeanId_fkey` FOREIGN KEY (`storageMeanId`) REFERENCES `StorageMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StorageMeanImage` ADD CONSTRAINT `StorageMeanImage_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMeanImage` ADD CONSTRAINT `PackagingMeanImage_packagingMeanId_fkey` FOREIGN KEY (`packagingMeanId`) REFERENCES `PackagingMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PackagingMeanImage` ADD CONSTRAINT `PackagingMeanImage_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE `Note` ADD CONSTRAINT `Note_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NoteLink` ADD CONSTRAINT `NoteLink_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `Note`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMean` ADD CONSTRAINT `TransportMean_transportMeanCategoryId_fkey` FOREIGN KEY (`transportMeanCategoryId`) REFERENCES `TransportMeanCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMean` ADD CONSTRAINT `TransportMean_plantId_fkey` FOREIGN KEY (`plantId`) REFERENCES `Plant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMean` ADD CONSTRAINT `TransportMean_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMeanImage` ADD CONSTRAINT `TransportMeanImage_transportMeanId_fkey` FOREIGN KEY (`transportMeanId`) REFERENCES `TransportMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMeanImage` ADD CONSTRAINT `TransportMeanImage_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMeanCategoryImage` ADD CONSTRAINT `TransportMeanCategoryImage_transportMeanCategoryId_fkey` FOREIGN KEY (`transportMeanCategoryId`) REFERENCES `TransportMeanCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMeanCategoryImage` ADD CONSTRAINT `TransportMeanCategoryImage_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMeanPackagingMean` ADD CONSTRAINT `TransportMeanPackagingMean_transportMeanId_fkey` FOREIGN KEY (`transportMeanId`) REFERENCES `TransportMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMeanPackagingMean` ADD CONSTRAINT `TransportMeanPackagingMean_packagingMeanId_fkey` FOREIGN KEY (`packagingMeanId`) REFERENCES `PackagingMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMeanPackagingMean` ADD CONSTRAINT `TransportMeanPackagingMean_packagingMeanPartPackagingMeanId_fkey` FOREIGN KEY (`packagingMeanPartPackagingMeanId`, `packagingMeanPartPartId`) REFERENCES `PackagingMeanPart`(`packagingMeanId`, `partId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMeanFlow` ADD CONSTRAINT `TransportMeanFlow_transportMeanId_fkey` FOREIGN KEY (`transportMeanId`) REFERENCES `TransportMean`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportMeanFlow` ADD CONSTRAINT `TransportMeanFlow_flowId_fkey` FOREIGN KEY (`flowId`) REFERENCES `Flow`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
