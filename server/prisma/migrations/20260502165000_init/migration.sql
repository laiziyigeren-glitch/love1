CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'PARTNER', 'ADMIN', 'VIEWER');
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CoupleSpace" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subtitle" TEXT,
  "accessPassword" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CoupleSpace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpaceMember" (
  "id" TEXT NOT NULL,
  "role" "MemberRole" NOT NULL DEFAULT 'ADMIN',
  "userId" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SpaceMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Profile" (
  "id" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nickname" TEXT,
  "avatarUrl" TEXT,
  "bio" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteConfig" (
  "id" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "heroTitle" TEXT NOT NULL,
  "heroText" TEXT NOT NULL,
  "story" TEXT NOT NULL,
  "stats" JSONB NOT NULL,
  "settings" JSONB NOT NULL,
  CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ThemeConfig" (
  "id" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "primaryColor" TEXT NOT NULL,
  "accentColor" TEXT NOT NULL,
  "backgroundUrl" TEXT,
  "effects" JSONB NOT NULL,
  CONSTRAINT "ThemeConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Anniversary" (
  "id" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "eventDate" TIMESTAMP(3) NOT NULL,
  "type" TEXT NOT NULL,
  "repeatYearly" BOOLEAN NOT NULL DEFAULT true,
  "showCountdown" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Anniversary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimelineEvent" (
  "id" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "eventDate" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "description" TEXT,
  "coverUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Album" (
  "id" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "coverUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "type" "MediaType" NOT NULL,
  "objectKey" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AlbumItem" (
  "id" TEXT NOT NULL,
  "albumId" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "takenAt" TIMESTAMP(3),
  "location" TEXT,
  "tags" TEXT[],
  "favorite" BOOLEAN NOT NULL DEFAULT false,
  "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AlbumItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoveLetter" (
  "id" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "signature" TEXT,
  "letterDate" TIMESTAMP(3),
  "status" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "LoveLetter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Song" (
  "id" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "artist" TEXT NOT NULL,
  "duration" INTEGER NOT NULL,
  "coverUrl" TEXT,
  "audioUrl" TEXT,
  "lyric" TEXT,
  "favorite" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Playlist" (
  "id" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "coverUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlaylistItem" (
  "id" TEXT NOT NULL,
  "playlistId" TEXT NOT NULL,
  "songId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PlaylistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShareLink" (
  "id" TEXT NOT NULL,
  "spaceId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "maxVisits" INTEGER,
  "visitCount" INTEGER NOT NULL DEFAULT 0,
  "allowPrivate" BOOLEAN NOT NULL DEFAULT false,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "CoupleSpace_slug_key" ON "CoupleSpace"("slug");
CREATE UNIQUE INDEX "SpaceMember_userId_spaceId_key" ON "SpaceMember"("userId", "spaceId");
CREATE UNIQUE INDEX "SiteConfig_spaceId_key" ON "SiteConfig"("spaceId");
CREATE UNIQUE INDEX "ThemeConfig_spaceId_key" ON "ThemeConfig"("spaceId");
CREATE UNIQUE INDEX "PlaylistItem_playlistId_songId_key" ON "PlaylistItem"("playlistId", "songId");
CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink"("token");

ALTER TABLE "SpaceMember" ADD CONSTRAINT "SpaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpaceMember" ADD CONSTRAINT "SpaceMember_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoupleSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoupleSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SiteConfig" ADD CONSTRAINT "SiteConfig_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoupleSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ThemeConfig" ADD CONSTRAINT "ThemeConfig_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoupleSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Anniversary" ADD CONSTRAINT "Anniversary_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoupleSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoupleSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Album" ADD CONSTRAINT "Album_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoupleSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoupleSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AlbumItem" ADD CONSTRAINT "AlbumItem_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AlbumItem" ADD CONSTRAINT "AlbumItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LoveLetter" ADD CONSTRAINT "LoveLetter_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoupleSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Song" ADD CONSTRAINT "Song_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoupleSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoupleSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlaylistItem" ADD CONSTRAINT "PlaylistItem_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlaylistItem" ADD CONSTRAINT "PlaylistItem_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "CoupleSpace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
