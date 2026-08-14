import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async () => {
	throw redirect(302, env.PUBLIC_MAIN_URL || 'https://www.xoniq.pro');
};