import { redirect } from '@sveltejs/kit';

export const GET = ({ params }) => {
	throw redirect(301, `/${params.slug}`);
};