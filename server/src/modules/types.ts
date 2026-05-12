export type ThemeConfig = {
  primaryColor: string;
  accentColor: string;
  backgroundUrl: string;
  effects: {
    particles: boolean;
    petals: boolean;
    glass: boolean;
    blur: number;
    brightness: number;
  };
};

export type Profile = {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
};

export type HomeSettings = {
  pageHeaders: Record<
    'home' | 'anniversary' | 'album' | 'music' | 'romance' | 'settings',
    {
      title: string;
      subtitle: string;
      imageUrl: string;
    }
  >;
  heartIndex: {
    value: number;
    labels: string[];
    values: number[];
    quote: string;
  };
  aboutImageUrl: string;
  aboutImageVisible: boolean;
  moments: Array<{
    id: string;
    title: string;
    date: string;
  }>;
  promises: Array<{
    id: string;
    icon: string;
    text: string;
    done?: boolean;
  }>;
  mailbox: {
    text: string;
    author: string;
  };
  music: {
    bgmSongId: string;
    volume: number;
    autoplay: boolean;
    moodPlaylists: Array<{
      id: string;
      title: string;
      description: string;
      coverUrl: string;
      songIds: string[];
    }>;
  };
  privacy: {
    passwordEnabled: boolean;
    password: string;
    privateAlbum: boolean;
    shareLinkEnabled: boolean;
  };
  profileCard: {
    tags: string[];
  };
  coupleEntrance: {
    mark: string;
    imageUrl: string;
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submitText: string;
  };
  reminders: {
    anniversaryEnabled: boolean;
    anniversaryDays: number;
    surpriseEnabled: boolean;
    dailyQuoteEnabled: boolean;
    dailyQuoteTime: string;
  };
  anniversaryPage: {
    startDate: string;
    startTitle: string;
    firstMeetDate: string;
    showCountdown: boolean;
    dailyQuotes: Array<{
      id: string;
      text: string;
      author: string;
    }>;
    importantMoments: Array<{
      id: string;
      title: string;
      date: string;
      description: string;
    }>;
    note: string;
  };
  heartGarden: {
    projects: HeartGardenProject[];
  };
};

export type Anniversary = {
  id: string;
  title: string;
  eventDate: string;
  type: string;
  calendarType: 'solar' | 'lunar';
  lunarMonth?: number | null;
  lunarDay?: number | null;
  lunarLeapMonth?: boolean;
  repeatYearly: boolean;
  showCountdown: boolean;
  description: string;
};

export type AlbumItem = {
  id: string;
  title: string;
  album: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO';
  url: string;
  thumbnailUrl: string;
  takenAt: string;
  location: string;
  tags: string[];
  favorite: boolean;
  visibility: 'PUBLIC' | 'PRIVATE';
};

export type LoveLetter = {
  id: string;
  title: string;
  body: string;
  signature: string;
  letterDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  visibleAt: string;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  lyric?: string;
  favorite: boolean;
  sortOrder: number;
};

export type HeartGardenProject = {
  id: string;
  title: string;
  type: 'html';
  group: 'particle' | 'confession' | 'custom';
  tag: string;
  icon: string;
  description: string;
  url: string;
  cover: string;
  status: 'ready' | 'pending';
  content?: string;
  entryFile?: string;
  linkedAssets?: Array<{
    id: string;
    sourceType: 'album' | 'video' | 'song';
    sourceId: string;
    title: string;
    url: string;
  }>;
  files?: Array<{
    id: string;
    path: string;
    type: 'html' | 'css' | 'js' | 'image' | 'audio' | 'video' | 'other';
    content?: string;
    url?: string;
    objectKey?: string;
    size?: number;
  }>;
};

export type SpaceData = {
  slug: string;
  name: string;
  subtitle: string;
  profiles: Profile[];
  site: {
    heroTitle: string;
    heroText: string;
    story: string;
    stats: Array<{ label: string; value: string }>;
    settings: HomeSettings;
  };
  theme: ThemeConfig;
  anniversaries: Anniversary[];
  albumItems: AlbumItem[];
  letters: LoveLetter[];
  songs: Song[];
};
