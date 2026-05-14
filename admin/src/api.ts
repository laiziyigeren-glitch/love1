import axios, { AxiosHeaders } from 'axios';

const apiBase = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
const api = axios.create({
  baseURL: apiBase,
  timeout: 30000,
});

const adminTokenKey = 'love1_admin_token';

export function getAdminToken() {
  return localStorage.getItem(adminTokenKey) || '';
}

export function setAdminToken(token: string) {
  localStorage.setItem(adminTokenKey, token);
}

export function clearAdminToken() {
  localStorage.removeItem(adminTokenKey);
}

api.interceptors.request.use((config) => {
  const token = getAdminToken();
  const headers = new AxiosHeaders(config.headers);

  headers.set('Cache-Control', 'no-cache');
  headers.set('Pragma', 'no-cache');

  if (String(config.method || 'get').toLowerCase() === 'get') {
    config.params = {
      ...(config.params || {}),
      _t: Date.now(),
    };
  }

  config.headers = headers;

  if (!token) return config;

  headers.set('Authorization', `Bearer ${token}`);

  return config;
});

export type Dashboard = {
  slug: string;
  name: string;
  subtitle: string;
  profiles: Array<{
    id: string;
    name: string;
    nickname: string;
    avatarUrl: string;
    bio: string;
  }>;
  site: {
    heroTitle: string;
    heroText: string;
    story: string;
    stats: Array<{ label: string; value: string }>;
    settings: {
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
      moments: Array<{ id: string; title: string; date: string }>;
      promises: Array<{ id: string; icon: string; text: string; done?: boolean }>;
      mailbox: { text: string; author: string };
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
      themeCustomBackgroundUrl?: string;
      anniversaryPage: {
        startDate: string;
        startTitle: string;
        firstMeetDate: string;
        showCountdown: boolean;
        dailyQuotes: Array<{ id: string; text: string; author: string }>;
        importantMoments: Array<{ id: string; title: string; date: string; description: string }>;
        note: string;
      };
      heartGarden: {
        projects: Array<{
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
        }>;
      };
    };
  };
  theme: {
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
  anniversaries: Array<{
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
  }>;
  albumItems: Array<{
    id: string;
    title: string;
    album: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'LIVE_PHOTO' | 'AUDIO';
    url: string;
    thumbnailUrl: string;
    takenAt: string;
    location: string;
    tags: string[];
    favorite: boolean;
    visibility: 'PUBLIC' | 'PRIVATE';
  }>;
  letters: Array<{
    id: string;
    title: string;
    body: string;
    signature: string;
    letterDate: string;
    status: string;
    visibleAt: string;
  }>;
  songs: Array<{
    id: string;
    title: string;
    artist: string;
    duration: number;
    coverUrl: string;
    audioUrl: string;
    lyric?: string;
    favorite: boolean;
    showInPlaylist: boolean;
    sortOrder: number;
  }>;
  nextAnniversary: {
    id: string;
    title: string;
    date: string;
    secondsUntil: number;
  } | null;
  counts: {
    anniversaries: number;
    photos: number;
    letters: number;
    songs: number;
  };
};

const spaceSlug = 'default';

export async function loginAdmin(payload: { email: string; password: string }) {
  const response = await api.post<{
    accessToken: string;
    email: string;
    expiresIn: number;
  }>('/api/admin/login', payload);
  setAdminToken(response.data.accessToken);
  return response.data;
}

export async function fetchDashboard(options: { compact?: boolean } = {}) {
  const response = await api.get<Dashboard>(`/api/admin/spaces/${spaceSlug}/dashboard`, {
    params: options.compact ? { compact: '1' } : undefined,
  });
  return response.data;
}

export async function saveSite(site: Dashboard['site']) {
  const response = await api.patch(`/api/admin/spaces/${spaceSlug}/site-config`, site);
  return response.data;
}

export async function fetchCoupleAccess() {
  const response = await api.get<{
    name: string;
    passwordSet: boolean;
  }>(`/api/admin/spaces/${spaceSlug}/couple-access`);
  return response.data;
}

export async function saveCoupleAccess(payload: { name: string; password?: string }) {
  const response = await api.patch<{
    name: string;
    passwordSet: boolean;
  }>(`/api/admin/spaces/${spaceSlug}/couple-access`, payload);
  return response.data;
}

export async function saveTheme(theme: Dashboard['theme']) {
  const response = await api.patch(`/api/admin/spaces/${spaceSlug}/theme-config`, theme);
  return response.data;
}

export async function saveProfiles(profiles: Dashboard['profiles']) {
  const response = await api.patch(`/api/admin/spaces/${spaceSlug}/profiles`, { profiles });
  return response.data;
}

export async function saveAnniversary(item: Dashboard['anniversaries'][number]) {
  const response = await api.post(`/api/admin/spaces/${spaceSlug}/anniversaries`, item);
  return response.data;
}

export async function deleteAnniversary(id: string) {
  await api.delete(`/api/admin/spaces/${spaceSlug}/anniversaries/${id}`);
}

export type UploadPathOptions = {
  purpose?:
    | 'avatar'
    | 'background'
    | 'about'
    | 'login'
    | 'page-header'
    | 'album'
    | 'video-poster'
    | 'music-audio'
    | 'music-cover'
    | 'music-playlist-cover'
    | 'heart-garden-cover'
    | 'heart-garden-html'
    | 'heart-garden-asset'
    | 'misc';
  folder?: string;
  group?: string;
};

export async function createUploadUrl(file: File, options: UploadPathOptions = {}) {
  const response = await api.post(`/api/admin/spaces/${spaceSlug}/media/upload-url`, {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    ...options,
  });
  return response.data as {
    objectKey: string;
    uploadUrl: string;
    publicUrl: string;
    expiresIn: number;
  };
}

export async function completeMediaUpload(payload: {
  objectKey: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  mediaType?: 'IMAGE' | 'VIDEO' | 'LIVE_PHOTO' | 'AUDIO';
  title?: string;
  albumTitle?: string;
  location?: string;
  takenAt?: string;
  tags?: string[];
  visibility?: 'PUBLIC' | 'PRIVATE';
}) {
  const response = await api.post(`/api/admin/spaces/${spaceSlug}/media/complete`, payload);
  return response.data;
}

export async function deleteAlbumItem(id: string) {
  await api.delete(`/api/admin/spaces/${spaceSlug}/albums/items/${id}`);
}

export async function updateAlbumItem(
  id: string,
  payload: Partial<Pick<Dashboard['albumItems'][number], 'title' | 'location' | 'takenAt' | 'tags' | 'favorite' | 'visibility'>> & {
    albumTitle?: string;
  },
) {
  const response = await api.patch(`/api/admin/spaces/${spaceSlug}/albums/items/${id}`, payload);
  return response.data as Dashboard['albumItems'][number];
}

export async function saveLetter(item: Dashboard['letters'][number]) {
  const response = await api.post(`/api/admin/spaces/${spaceSlug}/letters`, item);
  return response.data;
}

export async function deleteLetter(id: string) {
  await api.delete(`/api/admin/spaces/${spaceSlug}/letters/${id}`);
}

export async function saveSong(item: Dashboard['songs'][number]) {
  const response = await api.post(`/api/admin/spaces/${spaceSlug}/music/songs`, item);
  return response.data;
}

export async function deleteSong(id: string) {
  await api.delete(`/api/admin/spaces/${spaceSlug}/music/songs/${id}`);
}

export type AiConfig = {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  model: string;
  apiKeySet: boolean;
  apiKeyLast4: string;
  assistantName: string;
  openingMessage: string;
  personality: string;
  memoryEnabled: boolean;
  actionEnabled: boolean;
  allowCreateAnniversary: boolean;
  allowCreateImportantMoment: boolean;
  allowCreatePromise: boolean;
  allowDraftLetter: boolean;
  allowUpdateReminders: boolean;
  dailyMessageLimit: number;
  systemPromptOverride: string;
};

export type AiMemory = {
  id: string;
  type: string;
  content: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
};

export type AiAction = {
  id: string;
  type: string;
  label: string;
  title: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'done' | 'rejected' | string;
  result: unknown;
  sourceMessageId: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchAiConfig() {
  const response = await api.get<AiConfig>(`/api/admin/spaces/${spaceSlug}/ai/config`);
  return response.data;
}

export async function saveAiConfig(payload: Partial<AiConfig> & { apiKey?: string }) {
  const response = await api.patch<AiConfig>(`/api/admin/spaces/${spaceSlug}/ai/config`, payload);
  return response.data;
}

export async function testAiConfig() {
  const response = await api.post<{ success: boolean; message: string }>(`/api/admin/spaces/${spaceSlug}/ai/test`);
  return response.data;
}

export async function rebuildAiKnowledge() {
  const response = await api.post(`/api/admin/spaces/${spaceSlug}/ai/rebuild-knowledge`);
  return response.data as { summary: string; updatedAt: string };
}

export async function fetchAiKnowledge() {
  const response = await api.get(`/api/admin/spaces/${spaceSlug}/ai/knowledge`);
  return response.data as { summary: string; updatedAt: string };
}

export async function fetchAiMemories() {
  const response = await api.get<AiMemory[]>(`/api/admin/spaces/${spaceSlug}/ai/memories`);
  return response.data;
}

export async function updateAiMemory(id: string, payload: Partial<AiMemory>) {
  const response = await api.patch<AiMemory>(`/api/admin/spaces/${spaceSlug}/ai/memories/${id}`, payload);
  return response.data;
}

export async function deleteAiMemory(id: string) {
  await api.delete(`/api/admin/spaces/${spaceSlug}/ai/memories/${id}`);
}

export async function clearAiMemories() {
  await api.delete(`/api/admin/spaces/${spaceSlug}/ai/memories`);
}

export async function fetchAiActions() {
  const response = await api.get<AiAction[]>(`/api/admin/spaces/${spaceSlug}/ai/actions`);
  return response.data;
}
