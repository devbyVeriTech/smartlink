import Spotify from '$lib/assets/svgs/spotify.svg';
import AppleMusic from '$lib/assets/svgs/apple-music.svg';
import Apple from '$lib/assets/svgs/apple.svg';
import Youtube from '$lib/assets/svgs/youtube.svg';
import YoutubeMusic from '$lib/assets/svgs/youtubeMusic.svg';
import SoundCloud from '$lib/assets/svgs/soundcloud.svg';
import Deezer from '$lib/assets/svgs/deezer-s.svg';
import Tidal from '$lib/assets/svgs/tidal.svg';
import AmazonMusic from '$lib/assets/svgs/amazonMusic.svg';
import Amazon from '$lib/assets/svgs/amazon.svg';
import Pandora from '$lib/assets/svgs/pandora-s.svg';
import Boomplay from '$lib/assets/svgs/boomplay.svg';
import Anghami from '$lib/assets/svgs/anghami.svg';
import Audiomack from '$lib/assets/svgs/audiomackIcon.svg';
import Napster from '$lib/assets/svgs/napsterIcon.svg';
import Yandex from '$lib/assets/svgs/yandexIcon.svg';
import Bandcamp from '$lib/assets/svgs/bandcampIcon.svg';
import IHeart from '$lib/assets/svgs/iHeartRadioIcon.svg';
import Audius from '$lib/assets/svgs/audius.svg';
import Awa from '$lib/assets/svgs/awa.svg';
import Beatport from '$lib/assets/svgs/beatport.svg';
import Discogs from '$lib/assets/svgs/discogs.svg';
import Facebook from '$lib/assets/svgs/facebook.svg';
import Flo from '$lib/assets/svgs/flo.svg';
import Gaana from '$lib/assets/svgs/gaana.svg';
import Genius from '$lib/assets/svgs/genius.svg';
import Instagram from '$lib/assets/svgs/instagram.svg';
import JioSaavn from '$lib/assets/svgs/jio-saavn.svg';
import Joox from '$lib/assets/svgs/joox.svg';
import Kkbox from '$lib/assets/svgs/kkbox.svg';
import LineMusic from '$lib/assets/svgs/line-music.svg';
import MusicBrainz from '$lib/assets/svgs/music-brainz.svg';
import NetEase from '$lib/assets/svgs/netease.svg';
import Ototoy from '$lib/assets/svgs/ototoy.svg';
import Qobuz from '$lib/assets/svgs/qobuz.svg';
import QqMusic from '$lib/assets/svgs/qq-music.svg';
import SevenDigital from '$lib/assets/svgs/seven-digital.svg';
import Shazam from '$lib/assets/svgs/shazam.svg';
import Snapchat from '$lib/assets/svgs/snapchat.svg';
import TelmoreMusik from '$lib/assets/svgs/telmore-musik.svg';
import Tiktok from '$lib/assets/svgs/tiktok.svg';
import TiktokMusic from '$lib/assets/svgs/tiktok-music.svg';
import Trebel from '$lib/assets/svgs/trebel.svg';
import WynkMusic from '$lib/assets/svgs/wynk-music.svg';
import XLogo from '$lib/assets/svgs/x.svg';
import YouseeMusik from '$lib/assets/svgs/yousee-musik.svg';
import YoutubeShorts from '$lib/assets/svgs/youtube-shorts.svg';

export type PlatformInfo = {
	svg: string | null;
	color: string;
};

const svgMap: Record<string, string> = {
	spotify: Spotify,
	'apple music': AppleMusic,
	apple: Apple,
	youtube: Youtube,
	'youtube music': YoutubeMusic,
	soundcloud: SoundCloud,
	deezer: Deezer,
	tidal: Tidal,
	'amazon music': AmazonMusic,
	amazon: Amazon,
	pandora: Pandora,
	audiomack: Audiomack,
	anghami: Anghami,
	boomplay: Boomplay,
	youtubemusic: YoutubeMusic,
	youtubeMsusic: YoutubeMusic,
	napster: Napster,
	bandcamp: Bandcamp,
	yandex: Yandex,
	itunes: Apple,
	iheartradio: IHeart,
	audius: Audius,
	awa: Awa,
	beatport: Beatport,
	discogs: Discogs,
	facebook: Facebook,
	flo: Flo,
	gaana: Gaana,
	genius: Genius,
	instagram: Instagram,
	jiosaavn: JioSaavn,
	joox: Joox,
	kkbox: Kkbox,
	'line music': LineMusic,
	musicbrainz: MusicBrainz,
	netease: NetEase,
	ototoy: Ototoy,
	qobuz: Qobuz,
	'qq music': QqMusic,
	'7digital': SevenDigital,
	shazam: Shazam,
	snapchat: Snapchat,
	'telmore musik': TelmoreMusik,
	tiktok: Tiktok,
	'tiktok music': TiktokMusic,
	trebel: Trebel,
	'wynk music': WynkMusic,
	x: XLogo,
	'yousee musik': YouseeMusik,
	'youtube shorts': YoutubeShorts
};

const colorMap: Record<string, string> = {
	spotify: '#1DB954',
	'apple music': '#F9425D',
	apple: '#F9425D',
	youtube: '#FF0000',
	'youtube music': '#FF0000',
	soundcloud: '#FC3D0A',
	deezer: '#ac41ff',
	tidal: '#3b3573',
	'amazon music': '#2696d1',
	amazon: '#FF9900',
	pandora: '#2296f3',
	audiomack: '#ffa201',
	bandcamp: '#1DA0C3',
	beatport: '#93d501',
	napster: '#5db8f6',
	anghami: '#f300f9',
	boomplay: '#0052ff',
	musicbed: '#E60000',
	yandex: '#ffbc0d',
	itunes: '#F9425D',
	iheartradio: '#c6002b',
	audius: '#bd10e0',
	awa: '#000000',
	discogs: '#000000',
	facebook: '#3b5998',
	flo: '#3f3fff',
	gaana: '#e72d30',
	genius: '#000000',
	instagram: '#FD1D1D',
	jiosaavn: '#2bc5b4',
	joox: '#0dca5e',
	kkbox: '#09CEF6',
	'line music': '#0ad269',
	musicbrainz: '#BA478F',
	netease: '#ff0000',
	ototoy: '#2AB002',
	qobuz: '#0070EF',
	'qq music': '#11af52',
	'7digital': '#3254F0',
	shazam: '#066bff',
	snapchat: '#ffff00',
	'telmore musik': '#0066cc',
	tiktok: '#ff004f',
	'tiktok music': '#ff004f',
	trebel: '#000000',
	'wynk music': '#fa3335',
	x: '#000000',
	'yousee musik': '#0066cc',
	'youtube shorts': '#FF0000'
};

/** Provider keys that don't map onto a KNOWN_PLATFORMS entry by key or
 * display name — e.g. Odesli's `amazonStore` is the same platform as
 * `Amazon` (while `amazonMusic` is its own entry). */
export const PLATFORM_KEY_ALIASES: Record<string, string> = {
	amazonStore: 'Amazon',
	amazonstore: 'Amazon'
};

export const KNOWN_PLATFORMS = [
	{ name: 'Spotify', key: 'spotify', svg: svgMap.spotify, color: colorMap.spotify },
	{
		name: 'Apple Music',
		key: 'appleMusic',
		svg: svgMap['apple music'],
		color: colorMap['apple music']
	},
	{ name: 'YouTube', key: 'youtube', svg: svgMap.youtube, color: colorMap.youtube },
	{
		name: 'YouTube Music',
		key: 'ytmusic',
		svg: svgMap.youtubemusic,
		color: colorMap['youtube music']
	},
	{ name: 'SoundCloud', key: 'soundcloud', svg: svgMap.soundcloud, color: colorMap.soundcloud },
	{ name: 'Deezer', key: 'deezer', svg: svgMap.deezer, color: colorMap.deezer },
	{ name: 'Tidal', key: 'tidal', svg: svgMap.tidal, color: colorMap.tidal },
	{
		name: 'Amazon Music',
		key: 'amazonMusic',
		svg: svgMap['amazon music'],
		color: colorMap['amazon music']
	},
	{ name: 'Pandora', key: 'pandora', svg: svgMap.pandora, color: colorMap.pandora },
	{ name: 'Audiomack', key: 'audiomack', svg: svgMap.audiomack, color: colorMap.audiomack },
	{ name: 'Bandcamp', key: 'bandcamp', svg: svgMap.bandcamp, color: colorMap.bandcamp },
	{ name: 'Beatport', key: 'beatport', svg: svgMap.beatport, color: colorMap.beatport },
	{ name: 'Napster', key: 'napster', svg: svgMap.napster, color: colorMap.napster },
	{ name: 'Anghami', key: 'anghami', svg: svgMap.anghami, color: colorMap.anghami },
	{ name: 'Boomplay', key: 'boomplay', svg: svgMap.boomplay, color: colorMap.boomplay },
	{ name: 'Yandex', key: 'yandex', svg: svgMap.yandex, color: colorMap.yandex },
	{ name: 'Itunes', key: 'itunes', svg: svgMap.itunes, color: colorMap.itunes },
	{ name: 'iHeartRadio', key: 'iheartradio', svg: svgMap.iheartradio, color: colorMap.iheartradio },
	{ name: 'Musicbed', key: 'musicbed', svg: null, color: colorMap.musicbed },
	{ name: 'Amazon', key: 'amazon', svg: svgMap.amazon, color: colorMap.amazon },
	{ name: 'Audius', key: 'audius', svg: svgMap.audius, color: colorMap.audius },
	{ name: 'AWA', key: 'awa', svg: svgMap.awa, color: colorMap.awa },
	{ name: 'Discogs', key: 'discogs', svg: svgMap.discogs, color: colorMap.discogs },
	{ name: 'Facebook', key: 'facebook', svg: svgMap.facebook, color: colorMap.facebook },
	{ name: 'FLO', key: 'flo', svg: svgMap.flo, color: colorMap.flo },
	{ name: 'Gaana', key: 'gaana', svg: svgMap.gaana, color: colorMap.gaana },
	{ name: 'Genius', key: 'genius', svg: svgMap.genius, color: colorMap.genius },
	{ name: 'Instagram', key: 'instagram', svg: svgMap.instagram, color: colorMap.instagram },
	{ name: 'JioSaavn', key: 'jioSaavn', svg: svgMap.jiosaavn, color: colorMap.jiosaavn },
	{ name: 'Joox', key: 'joox', svg: svgMap.joox, color: colorMap.joox },
	{ name: 'KKBOX', key: 'kkbox', svg: svgMap.kkbox, color: colorMap.kkbox },
	{
		name: 'Line Music',
		key: 'lineMusic',
		svg: svgMap['line music'],
		color: colorMap['line music']
	},
	{ name: 'MusicBrainz', key: 'musicBrainz', svg: svgMap.musicbrainz, color: colorMap.musicbrainz },
	{ name: 'NetEase', key: 'netease', svg: svgMap.netease, color: colorMap.netease },
	{ name: 'OTOTOY', key: 'ototoy', svg: svgMap.ototoy, color: colorMap.ototoy },
	{ name: 'Qobuz', key: 'qobuz', svg: svgMap.qobuz, color: colorMap.qobuz },
	{ name: 'QQ Music', key: 'qqMusic', svg: svgMap['qq music'], color: colorMap['qq music'] },
	{ name: '7digital', key: 'sevenDigital', svg: svgMap['7digital'], color: colorMap['7digital'] },
	{ name: 'Shazam', key: 'shazam', svg: svgMap.shazam, color: colorMap.shazam },
	{ name: 'Snapchat', key: 'snapchat', svg: svgMap.snapchat, color: colorMap.snapchat },
	{
		name: 'Telmore Musik',
		key: 'telmoreMusik',
		svg: svgMap['telmore musik'],
		color: colorMap['telmore musik']
	},
	{ name: 'TikTok', key: 'tiktok', svg: svgMap.tiktok, color: colorMap.tiktok },
	{
		name: 'TikTok Music',
		key: 'tiktokMusic',
		svg: svgMap['tiktok music'],
		color: colorMap['tiktok music']
	},
	{ name: 'Trebel', key: 'trebel', svg: svgMap.trebel, color: colorMap.trebel },
	{
		name: 'Wynk Music',
		key: 'wynkMusic',
		svg: svgMap['wynk music'],
		color: colorMap['wynk music']
	},
	{ name: 'X', key: 'x', svg: svgMap.x, color: colorMap.x },
	{
		name: 'YouSee Musik',
		key: 'youseeMusik',
		svg: svgMap['yousee musik'],
		color: colorMap['yousee musik']
	},
	{
		name: 'YouTube Shorts',
		key: 'youtubeShorts',
		svg: svgMap['youtube shorts'],
		color: colorMap['youtube shorts']
	}
];

export function getPlatformSvg(name: string): string | null {
	const key = name.toLowerCase().trim();
	return svgMap[key] || null;
}

export function getPlatformColor(name: string): string {
	const key = name.toLowerCase().trim();
	return colorMap[key] || '#6B7280';
}

export function getPlatformBgClass(name: string): string {
	const key = name.toLowerCase().trim();
	if (key.includes('spotify')) return 'bg-[#1DB954]';
	if (key.includes('apple')) return 'bg-[#FA243C]';
	if (key.includes('youtube')) return 'bg-[#FF0000]';
	if (key.includes('soundcloud')) return 'bg-[#FF5500]';
	if (key.includes('deezer')) return 'bg-[#FEAA2D]';
	if (key.includes('tidal')) return 'bg-black';
	if (key.includes('amazon')) return 'bg-[#00A8E1]';
	if (key.includes('pandora')) return 'bg-[#4A297A]';
	if (key.includes('audiomack')) return 'bg-[#FF8C00]';
	if (key.includes('bandcamp')) return 'bg-[#629AA9]';
	if (key.includes('beatport')) return 'bg-[#01FF00]';
	if (key.includes('napster')) return 'bg-black';
	if (key.includes('anghami')) return 'bg-[#E3539B]';
	if (key.includes('boomplay')) return 'bg-[#4CAF50]';
	if (key.includes('itunes')) return 'bg-[#F9425D]';
	if (key.includes('yandex')) return 'bg-[#ffbc0d]';
	if (key.includes('iheartradio')) return 'bg-[#c6002b]';
	return 'bg-[#6B7280]';
}
