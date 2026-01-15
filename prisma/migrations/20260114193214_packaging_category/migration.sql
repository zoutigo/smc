-- CreateTable
CREATE TABLE `PackagingCategory` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'Description of packaging category',
    `description` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
