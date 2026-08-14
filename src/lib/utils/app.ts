import { env } from '$env/dynamic/public';

export let app = {
	name: 'Xoniq',
	slogan: 'Share Your Music',
	logo: '/uploads/logos/favico.webp',
	keywords:
		'music, sharing, social, platform, musician, artist, composer,smart link, bio link, link in bio',
	author: 'Xoniq',
	description:
		'Create stunning smart links that connect fans to your music on every platform. Beautiful, fast, and made for artists.',
	url: env.PUBLIC_LINKS_URL || 'https://play.xoniq.pro',
	mainUrl: env.PUBLIC_MAIN_URL || 'https://www.xoniq.pro',
	email: 'support@xoniq.pro',
	twitterHandle: '@xoniq'
};