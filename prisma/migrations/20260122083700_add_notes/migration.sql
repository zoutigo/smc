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

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NoteLink` ADD CONSTRAINT `NoteLink_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `Note`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
