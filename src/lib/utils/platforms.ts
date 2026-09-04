import Spotify from '$lib/assets/svgs/spotify.svg';
import AppleMusic from '$lib/assets/svgs/apple-music.svg';
import Apple from '$lib/assets/svgs/apple.svg';
import Youtube from '$lib/assets/svgs/youtube.svg';
import YoutubeMusic from '$lib/assets/svgs/youtubeMusic.svg';
import SoundCloud from '$lib/assets/svgs/soundcloud.svg';
import Deezer from '$lib/assets/svgs/deezer-s.svg';
import Tidal from '$lib/assets/svgs/tidal.svg';
import AmazonMusic from '$lib/assets/svgs/amazonMusic.svg';
import Pandora from '$lib/assets/svgs/pandora-s.svg';
import Boomplay from '$lib/assets/svgs/boomplay.svg';
import Anghami from '$lib/assets/svgs/anghami.svg';
import Audiomack from '$lib/assets/svgs/audiomackIcon.svg';
import Napster from '$lib/assets/svgs/napsterIcon.svg';
import Yandex from '$lib/assets/svgs/yandexIcon.svg';
import Bandcamp from '$lib/assets/svgs/bandcampIcon.svg';
import IHeart from '$lib/assets/svgs/iHeartRadioIcon.svg';

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
	amazon: AmazonMusic,
	pandora: Pandora,
	audiomack: Audiomack,
	anghami: Anghami,
	boomplay: Boomplay,
	youtubemusic: YoutubeMusic,
	napster: Napster,
	bandcamp: Bandcamp,
	yandex: Yandex,
	itunes: Apple,
	iheartradio: IHeart
};

const colorMap: Record<string, string> = {
	spotify: '#1DB954',
	'apple music': '#F9425D',
	apple: '#F9425D',
	youtube: '#FF0000',
	'youtube music': '#FF0000',
	soundcloud: '#FF5500',
	deezer: '#FEAA2D',
	tidal: '#000000',
	'amazon music': '#2696d1',
	amazon: '#00A8E1',
	pandora: '#4A297A',
	audiomack: '#ffa201',
	bandcamp: '#1DA0C3',
	beatport: '#01FF00',
	napster: '#5db8f6',
	anghami: '#f300f9',
	boomplay: '#0052ff',
	musicbed: '#E60000',
	yandex: '#ffbc0d',
	itunes: '#F9425D',
	iheartradio: '#c6002b'
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
	{ name: 'YouTube Music', key: 'ytmusic', svg: svgMap.youtubemusic, color: colorMap['youtube music'] },
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
	{ name: 'Audiomack', key: 'audiomack', svg: null, color: colorMap.audiomack },
	{ name: 'Bandcamp', key: 'bandcamp', svg: null, color: colorMap.bandcamp },
	{ name: 'Beatport', key: 'beatport', svg: null, color: colorMap.beatport },
	{ name: 'Napster', key: 'napster', svg: null, color: colorMap.napster },
	{ name: 'Anghami', key: 'anghami', svg: null, color: colorMap.anghami },
	{ name: 'Boomplay', key: 'boomplay', svg: null, color: colorMap.boomplay },
	{ name: 'Yandex', key: 'yandex', svg: null, color: colorMap.yandex },
	{ name: 'Itunes', key: 'itunes', svg: null, color: colorMap.itunes },
	{ name: 'iHeartRadio', key: 'iheartradio', svg: null, color: colorMap.iheartradio },
	{ name: 'Musicbed', key: 'musicbed', svg: null, color: colorMap.musicbed }
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
