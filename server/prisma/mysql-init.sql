CREATE TABLE IF NOT EXISTS `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `displayName` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `CoupleSpace` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `subtitle` TEXT NULL,
  `accessName` VARCHAR(191) NULL,
  `accessPassword` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CoupleSpace_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SpaceMember` (
  `id` VARCHAR(191) NOT NULL,
  `role` ENUM('OWNER','PARTNER','ADMIN','VIEWER') NOT NULL DEFAULT 'ADMIN',
  `userId` VARCHAR(191) NOT NULL,
  `spaceId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SpaceMember_userId_spaceId_key` (`userId`, `spaceId`),
  KEY `SpaceMember_spaceId_idx` (`spaceId`),
  CONSTRAINT `SpaceMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `SpaceMember_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `CoupleSpace`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Profile` (
  `id` VARCHAR(191) NOT NULL,
  `spaceId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `nickname` VARCHAR(191) NULL,
  `avatarUrl` TEXT NULL,
  `bio` TEXT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `Profile_spaceId_idx` (`spaceId`),
  CONSTRAINT `Profile_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `CoupleSpace`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SiteConfig` (
  `id` VARCHAR(191) NOT NULL,
  `spaceId` VARCHAR(191) NOT NULL,
  `heroTitle` VARCHAR(191) NOT NULL,
  `heroText` TEXT NOT NULL,
  `story` TEXT NOT NULL,
  `stats` JSON NOT NULL,
  `settings` JSON NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SiteConfig_spaceId_key` (`spaceId`),
  CONSTRAINT `SiteConfig_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `CoupleSpace`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ThemeConfig` (
  `id` VARCHAR(191) NOT NULL,
  `spaceId` VARCHAR(191) NOT NULL,
  `primaryColor` VARCHAR(191) NOT NULL,
  `accentColor` VARCHAR(191) NOT NULL,
  `backgroundUrl` TEXT NULL,
  `effects` JSON NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ThemeConfig_spaceId_key` (`spaceId`),
  CONSTRAINT `ThemeConfig_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `CoupleSpace`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Anniversary` (
  `id` VARCHAR(191) NOT NULL,
  `spaceId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `eventDate` DATETIME(3) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `repeatYearly` BOOLEAN NOT NULL DEFAULT TRUE,
  `showCountdown` BOOLEAN NOT NULL DEFAULT FALSE,
  `description` TEXT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `Anniversary_spaceId_idx` (`spaceId`),
  CONSTRAINT `Anniversary_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `CoupleSpace`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `TimelineEvent` (
  `id` VARCHAR(191) NOT NULL,
  `spaceId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `eventDate` DATETIME(3) NOT NULL,
  `location` VARCHAR(191) NULL,
  `description` TEXT NULL,
  `coverUrl` TEXT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `TimelineEvent_spaceId_idx` (`spaceId`),
  CONSTRAINT `TimelineEvent_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `CoupleSpace`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Album` (
  `id` VARCHAR(191) NOT NULL,
  `spaceId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `coverUrl` TEXT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `Album_spaceId_idx` (`spaceId`),
  CONSTRAINT `Album_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `CoupleSpace`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MediaAsset` (
  `id` VARCHAR(191) NOT NULL,
  `spaceId` VARCHAR(191) NOT NULL,
  `type` ENUM('IMAGE','VIDEO','AUDIO') NOT NULL,
  `objectKey` VARCHAR(191) NOT NULL,
  `url` TEXT NOT NULL,
  `thumbnailUrl` TEXT NULL,
  `mimeType` VARCHAR(191) NOT NULL,
  `size` INTEGER NOT NULL,
  `width` INTEGER NULL,
  `height` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `MediaAsset_spaceId_idx` (`spaceId`),
  CONSTRAINT `MediaAsset_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `CoupleSpace`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AlbumItem` (
  `id` VARCHAR(191) NOT NULL,
  `albumId` VARCHAR(191) NOT NULL,
  `mediaId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `takenAt` DATETIME(3) NULL,
  `location` VARCHAR(191) NULL,
  `tags` JSON NOT NULL,
  `favorite` BOOLEAN NOT NULL DEFAULT FALSE,
  `visibility` ENUM('PUBLIC','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `AlbumItem_albumId_idx` (`albumId`),
  KEY `AlbumItem_mediaId_idx` (`mediaId`),
  CONSTRAINT `AlbumItem_albumId_fkey` FOREIGN KEY (`albumId`) REFERENCES `Album`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `AlbumItem_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `MediaAsset`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `LoveLetter` (
  `id` VARCHAR(191) NOT NULL,
  `spaceId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `signature` VARCHAR(191) NULL,
  `letterDate` DATETIME(3) NULL,
  `status` ENUM('DRAFT','PUBLISHED','HIDDEN') NOT NULL DEFAULT 'PUBLISHED',
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `LoveLetter_spaceId_idx` (`spaceId`),
  CONSTRAINT `LoveLetter_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `CoupleSpace`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Song` (
  `id` VARCHAR(191) NOT NULL,
  `spaceId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `artist` VARCHAR(191) NOT NULL,
  `duration` INTEGER NOT NULL,
  `coverUrl` LONGTEXT NULL,
  `audioUrl` LONGTEXT NULL,
  `lyric` LONGTEXT NULL,
  `favorite` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  KEY `Song_spaceId_idx` (`spaceId`),
  CONSTRAINT `Song_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `CoupleSpace`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Playlist` (
  `id` VARCHAR(191) NOT NULL,
  `spaceId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `coverUrl` TEXT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `Playlist_spaceId_idx` (`spaceId`),
  CONSTRAINT `Playlist_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `CoupleSpace`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PlaylistItem` (
  `id` VARCHAR(191) NOT NULL,
  `playlistId` VARCHAR(191) NOT NULL,
  `songId` VARCHAR(191) NOT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PlaylistItem_playlistId_songId_key` (`playlistId`, `songId`),
  KEY `PlaylistItem_songId_idx` (`songId`),
  CONSTRAINT `PlaylistItem_playlistId_fkey` FOREIGN KEY (`playlistId`) REFERENCES `Playlist`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `PlaylistItem_songId_fkey` FOREIGN KEY (`songId`) REFERENCES `Song`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ShareLink` (
  `id` VARCHAR(191) NOT NULL,
  `spaceId` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NULL,
  `maxVisits` INTEGER NULL,
  `visitCount` INTEGER NOT NULL DEFAULT 0,
  `allowPrivate` BOOLEAN NOT NULL DEFAULT FALSE,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ShareLink_token_key` (`token`),
  KEY `ShareLink_spaceId_idx` (`spaceId`),
  CONSTRAINT `ShareLink_spaceId_fkey` FOREIGN KEY (`spaceId`) REFERENCES `CoupleSpace`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `target` VARCHAR(191) NOT NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `AuditLog_userId_idx` (`userId`),
  CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
