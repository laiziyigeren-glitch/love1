const argon2 = require('argon2');
const { PrismaClient, MediaType, MemberRole, PublishStatus, Visibility } = require('@prisma/client');

process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:123456@localhost:3306/love1';

const prisma = new PrismaClient();

function date(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const homeSettings = {
  heartIndex: {
    value: 98,
    labels: ['05-26', '06-02', '06-09', '06-16', '06-23'],
    values: [60, 50, 45, 35, 5],
    quote: '愿每一天都比昨天更爱你一点点',
  },
  aboutImageUrl: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&w=600&q=70',
  aboutImageVisible: true,
  moments: [
    { id: 'moment-first-meet', title: '第一次见面', date: '2022-05-20' },
    { id: 'moment-confirm', title: '确认关系', date: '2022-06-18' },
    { id: 'moment-travel', title: '第一次旅行', date: '2022-10-03' },
    { id: 'moment-sunrise', title: '一起看日出', date: '2023-01-01' },
  ],
  promises: [
    { id: 'promise-travel', icon: '🌍', text: '一起去看遍世界的美景' },
    { id: 'promise-pet', icon: '🐱', text: '一起养一只可爱的猫咪' },
    { id: 'promise-dream', icon: '✅', text: '一起实现彼此的梦想' },
    { id: 'promise-forever', icon: '⭐', text: '一起慢慢变老，直到永远' },
  ],
  mailbox: {
    text: '谢谢你出现在我的生命里，你让我的世界变得完整而美好。每一个和你在一起的日子，都是我最珍贵的收藏。',
    author: '致我最爱的人',
  },
  anniversaryPage: {
    startDate: '2022-05-20T00:00',
    startTitle: '我们的开始',
    dailyQuotes: [
      { id: 'quote-1', text: '最好的日子，不在于惊天动地，而在于有你在身边的每一天。', author: 'You & Me' },
      { id: 'quote-2', text: '把普通的今天过好，就是我们最长情的纪念。', author: 'You & Me' },
      { id: 'quote-3', text: '愿每一个被记住的日子，都能成为下一次拥抱的理由。', author: 'You & Me' },
    ],
    note: '谢谢你出现在我的生命里，让平凡的日子变得闪闪发光。\n未来的每一个纪念日，我都想和你一起走过。',
  },
};

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@love.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const passwordHash = await argon2.hash(adminPassword);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      displayName: '管理员',
    },
    update: {
      displayName: '管理员',
    },
  });

  const space = await prisma.coupleSpace.upsert({
    where: { slug: 'default' },
    create: {
      slug: 'default',
      name: 'You & Me',
      subtitle: '因为有你，世界变得温柔',
    },
    update: {
      name: 'You & Me',
      subtitle: '因为有你，世界变得温柔',
    },
  });

  await prisma.spaceMember.upsert({
    where: {
      userId_spaceId: {
        userId: user.id,
        spaceId: space.id,
      },
    },
    create: {
      userId: user.id,
      spaceId: space.id,
      role: MemberRole.OWNER,
    },
    update: {
      role: MemberRole.OWNER,
    },
  });

  await prisma.profile.upsert({
    where: { id: 'profile-couple' },
    create: {
      id: 'profile-couple',
      spaceId: space.id,
      name: 'You & Me',
      nickname: '我的全世界',
      avatarUrl: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=200&q=80',
      bio: '在茫茫人海中相遇，在彼此的世界里相知相守。',
      sortOrder: 0,
    },
    update: {
      name: 'You & Me',
      nickname: '我的全世界',
      avatarUrl: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=200&q=80',
      bio: '在茫茫人海中相遇，在彼此的世界里相知相守。',
      sortOrder: 0,
    },
  });

  await prisma.siteConfig.upsert({
    where: { spaceId: space.id },
    create: {
      spaceId: space.id,
      heroTitle: '遇见你，是我最美丽的意外',
      heroText: '感谢命运让我们相遇，从此，你的名字就是我最温暖的诗篇。',
      story: '我们一起笑过、闹过、感动过，也一起期待着每一个明天。',
      stats: [
        { label: '心动天数', value: '520' },
        { label: '甜蜜瞬间', value: '1314' },
        { label: '共同约定', value: '12' },
      ],
      settings: homeSettings,
    },
    update: {
      heroTitle: '遇见你，是我最美丽的意外',
      heroText: '感谢命运让我们相遇，从此，你的名字就是我最温暖的诗篇。',
      story: '我们一起笑过、闹过、感动过，也一起期待着每一个明天。',
      stats: [
        { label: '心动天数', value: '520' },
        { label: '甜蜜瞬间', value: '1314' },
        { label: '共同约定', value: '12' },
      ],
    },
  });

  await prisma.themeConfig.upsert({
    where: { spaceId: space.id },
    create: {
      spaceId: space.id,
      primaryColor: '#e8748a',
      accentColor: '#d4956a',
      backgroundUrl: 'https://images.unsplash.com/photo-1536514498073-50e69d39c6cf?auto=format&fit=crop&w=1920&q=70',
      effects: {
        particles: true,
        petals: true,
        glass: true,
        blur: 72,
        brightness: 68,
      },
    },
    update: {
      primaryColor: '#e8748a',
      accentColor: '#d4956a',
      backgroundUrl: 'https://images.unsplash.com/photo-1536514498073-50e69d39c6cf?auto=format&fit=crop&w=1920&q=70',
      effects: {
        particles: true,
        petals: true,
        glass: true,
        blur: 72,
        brightness: 68,
      },
    },
  });

  await prisma.anniversary.upsert({
    where: { id: 'anniv-together' },
    create: {
      id: 'anniv-together',
      spaceId: space.id,
      title: '在一起纪念日',
      eventDate: date('2022-05-20'),
      type: 'love',
      repeatYearly: true,
      showCountdown: true,
      description: '我们正式在一起啦。',
      sortOrder: 1,
    },
    update: {
      title: '在一起纪念日',
      eventDate: date('2022-05-20'),
      type: 'love',
      repeatYearly: true,
      showCountdown: true,
      description: '我们正式在一起啦。',
      sortOrder: 1,
    },
  });

  await prisma.anniversary.upsert({
    where: { id: 'anniv-first-meet' },
    create: {
      id: 'anniv-first-meet',
      spaceId: space.id,
      title: '第一次见面',
      eventDate: date('2022-05-05'),
      type: 'meet',
      repeatYearly: true,
      showCountdown: false,
      description: '在咖啡厅那个下午。',
      sortOrder: 0,
    },
    update: {
      title: '第一次见面',
      eventDate: date('2022-05-05'),
      type: 'meet',
      repeatYearly: true,
      showCountdown: false,
      description: '在咖啡厅那个下午。',
      sortOrder: 0,
    },
  });

  const album = await prisma.album.upsert({
    where: { id: 'album-travel' },
    create: {
      id: 'album-travel',
      spaceId: space.id,
      title: '旅行',
      description: '一起看过的风景。',
      coverUrl: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=600&q=80',
      sortOrder: 0,
    },
    update: {
      title: '旅行',
      description: '一起看过的风景。',
      coverUrl: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=600&q=80',
      sortOrder: 0,
    },
  });

  const media = await prisma.mediaAsset.upsert({
    where: { id: 'media-sunset' },
    create: {
      id: 'media-sunset',
      spaceId: space.id,
      type: MediaType.IMAGE,
      objectKey: 'seed/sunset.jpg',
      url: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=240&q=70',
      mimeType: 'image/jpeg',
      size: 0,
    },
    update: {
      url: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=600&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=240&q=70',
    },
  });

  await prisma.albumItem.upsert({
    where: { id: 'album-sunset' },
    create: {
      id: 'album-sunset',
      albumId: album.id,
      mediaId: media.id,
      title: '日落与海，还有你',
      description: '那天的晚霞很美，但更美的是和你一起看晚霞的时光。',
      takenAt: date('2025-05-18'),
      location: '青岛 海边',
      tags: ['旅行', '日落'],
      favorite: true,
      visibility: Visibility.PUBLIC,
      sortOrder: 0,
    },
    update: {
      title: '日落与海，还有你',
      description: '那天的晚霞很美，但更美的是和你一起看晚霞的时光。',
      takenAt: date('2025-05-18'),
      location: '青岛 海边',
      tags: ['旅行', '日落'],
      favorite: true,
      visibility: Visibility.PUBLIC,
      sortOrder: 0,
    },
  });

  await prisma.loveLetter.upsert({
    where: { id: 'letter-1' },
    create: {
      id: 'letter-1',
      spaceId: space.id,
      title: '致你的信',
      body: '遇见你，是我这一生最美好的事情。谢谢你愿意走进我的生命。',
      signature: '爱你的他',
      letterDate: date('2025-05-20'),
      status: PublishStatus.PUBLISHED,
      sortOrder: 0,
    },
    update: {
      title: '致你的信',
      body: '遇见你，是我这一生最美好的事情。谢谢你愿意走进我的生命。',
      signature: '爱你的他',
      letterDate: date('2025-05-20'),
      status: PublishStatus.PUBLISHED,
      sortOrder: 0,
    },
  });

  const song = await prisma.song.upsert({
    where: { id: 'song-lucky' },
    create: {
      id: 'song-lucky',
      spaceId: space.id,
      title: '小幸运',
      artist: '田馥甄',
      duration: 265,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=240&q=70',
      lyric: '愿你所到之处，遍地都是小幸运。',
      favorite: true,
    },
    update: {
      title: '小幸运',
      artist: '田馥甄',
      duration: 265,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=240&q=70',
      lyric: '愿你所到之处，遍地都是小幸运。',
      favorite: true,
    },
  });

  const playlist = await prisma.playlist.upsert({
    where: { id: 'playlist-main' },
    create: {
      id: 'playlist-main',
      spaceId: space.id,
      title: '专属歌单',
      sortOrder: 0,
    },
    update: {
      title: '专属歌单',
      sortOrder: 0,
    },
  });

  await prisma.playlistItem.upsert({
    where: {
      playlistId_songId: {
        playlistId: playlist.id,
        songId: song.id,
      },
    },
    create: {
      playlistId: playlist.id,
      songId: song.id,
      sortOrder: 0,
    },
    update: {
      sortOrder: 0,
    },
  });

  console.log(`Seeded default space "${space.slug}" and admin "${adminEmail}".`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
