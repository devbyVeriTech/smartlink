export function slugify(text: string): string {
	if (!text) return '';
	return text
		.toString()
		.toLowerCase()
		.replace(/&/g, 'and') // Replace & with 'and'
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(/[^\w\-]+/g, '') // Remove all non-word chars
		.replace(/\-\-+/g, '-') // Replace multiple - with single -
		.replace(/^-+/, '') // Trim - from start of text
		.replace(/-+$/, ''); // Trim - from end of text
}

export function getMainArtist(text: string): string {
	if (!text) return '';
	// Split by common separators: commas, ampersands, and 'feat.', 'ft.', 'featuring'
	const parts = text.split(/,|&|feat\.|ft\.|featuring/i);
	return parts[0].trim();
}
