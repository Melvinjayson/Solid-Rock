// Public, read-only social/website aggregation for the Solid Rock app.
// Vercel serverless endpoint. API secrets must be configured on the server,
// never prefixed EXPO_PUBLIC_, never returned in the JSON.
// YouTube channel ID verified from @solidrockcentre RSS metadata on 2026-11-08.
const CHANNEL_ID = 'UCM6SGgWXyUDlCaZ8iYnIuKQ';
const CHANNEL = 'https://www.youtube.com/@solidrockcentre';
const INSTAGRAM = 'https://www.instagram.com/solidrockcentre/';
const PLAYLISTS = [
  { id: 'PLY36ho3KNKuhilzkq9THo_5xTBoAFsvPL', title: 'The Year of Greater Glory' },
  { id: 'PLY36ho3KNKuhwVO3TPdXS1CTcvDAWUPMp', title: 'Short clips' },
  { id: 'PLY36ho3KNKugZVNY1FlVT02tXn04QzzFi', title: 'Guest Ministers' },
  { id: 'PLY36ho3KNKugJDFGFkYNc0MoSLNv4Cuey', title: 'Kids Zone' },
];
const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const playlistIdPattern = /^PL[A-Za-z0-9_-]{12,}$/;
const encode = encodeURIComponent;

async function jsonFetch(url, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) throw new Error('Upstream HTTP ' + response.status);
    return await response.json();
  } finally { clearTimeout(timer); }
}
function ytUrl(path, params, key) {
  return 'https://www.googleapis.com/youtube/v3/' + path + '?' + new URLSearchParams({ ...params, key }).toString();
}
function thumbnail(snippet) {
  return snippet?.thumbnails?.high?.url || snippet?.thumbnails?.medium?.url || snippet?.thumbnails?.default?.url || null;
}
function parseDuration(s) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(s || '');
  return m ? (Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0)) : null;
}
function safeText(value, max = 500) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, ' ').slice(0, max) : '';
}
function base() {
  return {
    version: 1, channelId: CHANNEL_ID, channelUrl: CHANNEL, instagramUrl: INSTAGRAM,
    fetchedAt: new Date().toISOString(), activeLive: null,
    videos: [], clips: [], instagram: [], news: [], playlists: PLAYLISTS,
    sources: { youtube: 'unconfigured', instagram: 'unconfigured', website: 'unconfigured' },
  };
}
async function youtubeFeed(result) {
  const key = process.env.YOUTUBE_DATA_API_KEY;
  if (!key) return;
  try {
    const channel = await jsonFetch(ytUrl('channels', { part: 'contentDetails,snippet', id: CHANNEL_ID }, key));
    const uploads = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploads) throw Error('Channel uploads playlist unavailable');
    // playlistItems and videos.list each cost 1 unit per call, unlike search.list (100).
    const uploadsList = await jsonFetch(ytUrl('playlistItems', { part: 'snippet,contentDetails', playlistId: uploads, maxResults: '25' }, key));
    const entries = (uploadsList.items || [])
      .map(item => ({ id: item?.contentDetails?.videoId || item?.snippet?.resourceId?.videoId, snippet: item?.snippet }))
      .filter(item => videoIdPattern.test(item.id)).slice(0, 25);
    const ids = entries.map(x => x.id).join(',');
    let detail = [];
    if (ids) {
      const v = await jsonFetch(ytUrl('videos', { part: 'snippet,contentDetails,liveStreamingDetails,status', id: ids }, key));
      detail = v.items || [];
    }
    const videos = detail
      .filter(v => videoIdPattern.test(v.id) && v.status?.privacyStatus === 'public')
      .map(v => ({
        id: v.id, title: safeText(v.snippet?.title, 180), description: safeText(v.snippet?.description, 360),
        thumbnail: thumbnail(v.snippet), publishedAt: v.snippet?.publishedAt || null,
        durationSeconds: parseDuration(v.contentDetails?.duration),
        state: v.snippet?.liveBroadcastContent === 'live' ? 'live' :
          v.snippet?.liveBroadcastContent === 'upcoming' ? 'upcoming' : 'recorded',
        url: 'https://www.youtube.com/watch?v=' + v.id,
      }));
    result.videos = videos.filter(v => v.state === 'recorded').slice(0, 18);
    result.clips = videos.filter(v => v.state === 'recorded' && v.durationSeconds !== null && v.durationSeconds <= 180).slice(0, 12);
    const active = videos.find(v => v.state === 'live');
    if (active) result.activeLive = active;
    // A live-stream search is more expensive; run only if uploads has no active broadcast.
    // CDN cache is set below; do not bypass the shared cache for each app instance.
    if (!result.activeLive) {
      const search = await jsonFetch(ytUrl('search', {
        part: 'snippet', channelId: CHANNEL_ID, eventType: 'live', type: 'video', maxResults: '1'
      }, key));
      const hit = search.items?.find(i => videoIdPattern.test(i.id?.videoId));
      if (hit) result.activeLive = {
        id: hit.id.videoId, title: safeText(hit.snippet?.title, 180),
        description: safeText(hit.snippet?.description, 360),
        thumbnail: thumbnail(hit.snippet), publishedAt: hit.snippet?.publishedAt || null,
        durationSeconds: null, state: 'live',
        url: 'https://www.youtube.com/watch?v=' + hit.id.videoId,
      };
    }
    result.sources.youtube = 'ready';
  } catch (err) {
    result.sources.youtube = 'unavailable';
    console.warn('YouTube feed unavailable:', err instanceof Error ? err.message : 'unknown');
  }
}
async function instagramFeed(result) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN, userId = process.env.INSTAGRAM_USER_ID;
  if (!token || !userId || !/^\d+$/.test(userId)) return;
  try {
    const root = process.env.INSTAGRAM_GRAPH_HOST === 'facebook' ? 'https://graph.facebook.com' : 'https://graph.instagram.com';
    const url = root + '/v24.0/' + userId + '/media?' + new URLSearchParams({
      fields: 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp',
      limit: '15', access_token: token,
    }).toString();
    const payload = await jsonFetch(url);
    result.instagram = (payload.data || []).filter(p => typeof p.permalink === 'string' &&
      /^https:\/\/www\.instagram\.com\//.test(p.permalink))
      .slice(0, 15).map(p => ({
        id: String(p.id), caption: safeText(p.caption, 350),
        type: safeText(p.media_product_type || p.media_type, 24),
        thumbnail: typeof (p.thumbnail_url || p.media_url) === 'string' ? (p.thumbnail_url || p.media_url) : null,
        permalink: p.permalink, timestamp: p.timestamp || null
      }));
    result.sources.instagram = 'ready';
  } catch (err) {
    result.sources.instagram = 'unavailable';
    console.warn('Instagram feed unavailable:', err instanceof Error ? err.message : 'unknown');
  }
}
async function websiteFeed(result) {
  // Only an explicitly approved church-owned RSS/Atom URL may be queried.
  const rss = process.env.CHURCH_NEWS_RSS_URL;
  if (!rss) return;
  try {
    const parsed = new URL(rss);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'solidrockdublin.org') throw Error('RSS domain not approved');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    let xml;
    try {
      const response = await fetch(rss, { signal: controller.signal });
      if (!response.ok) throw Error('RSS unavailable: ' + response.status);
      xml = (await response.text()).slice(0, 250000);
    } finally { clearTimeout(timer); }
    const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)].slice(0, 12);
    const tag = (body, name) => {
      const match = new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + name + '>').exec(body);
      return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/&(?:amp|#38);/g, '&').trim() : '';
    };
    result.news = items.map((m, i) => {
      const body = m[1], href = tag(body, 'link');
      return { id: String(i), title: safeText(tag(body, 'title'), 180),
        summary: safeText(tag(body, 'description'), 240),
        url: /^https:\/\/solidrockdublin\.org\//.test(href) ? href : 'https://solidrockdublin.org/',
        publishedAt: tag(body, 'pubDate') || null };
    }).filter(x => x.title);
    result.sources.website = 'ready';
  } catch (err) {
    result.sources.website = 'unavailable';
    console.warn('Church website RSS unavailable:', err instanceof Error ? err.message : 'unknown');
  }
}

let cache = null;
let cachedUntil = 0;
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  const ttlSeconds = 900; // 15-minute shared-cache window; controls YouTube quota.
  res.setHeader('Access-Control-Allow-Origin', '*'); // public read-only data, never member records.
  res.setHeader('Cache-Control', 'public, s-maxage=' + ttlSeconds + ', stale-while-revalidate=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (cache && Date.now() < cachedUntil) return res.status(200).json(cache);
  const result = base();
  await Promise.all([youtubeFeed(result), instagramFeed(result), websiteFeed(result)]);
  cache = result; cachedUntil = Date.now() + ttlSeconds * 1000;
  return res.status(200).json(result);
};
