export interface User {
	id: string;
	email: string;
	username: string;
	displayName: string;
	bio?: string;
	avatar?: string;
	banner?: string;
	location?: string;
	website?: string;
	socialLinks?: {
		twitter?: string;
		instagram?: string;
		youtube?: string;
		spotify?: string;
		soundcloud?: string;
		tiktok?: string;
		bandcamp?: string;
	};
	followersCount: number;
	followingCount: number;
	linksCount: number;
	isVerified: boolean;
	isPremium: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface Profile {
	user: User;
	links: Link[];
	isFollowing?: boolean;
}

export interface Follow {
	id: string;
	followerId: string;
	followingId: string;
	createdAt: Date;
}

export interface Activity {
	id: string;
	userId: string;
	type: 'link_created' | 'profile_updated' | 'followed_user';
	content: string;
	metadata?: Record<string, any>;
	createdAt: Date;
	user?: User;
}

export interface Link {
	id: string;
	userId: string;
	artistId?: string;
	title: string;
	artist: string;
	artwork: string;
	cloudinaryPublicId?: string;
	cloudinaryUrl?: string;
	url: string;
	slug: string;
	description?: string;
	genre?: string;
	tags?: string[];
	clicks: number;
	uniqueClicks: number;
	isPublic: boolean;
	isFeatured: boolean;
	notifyFollowers: boolean;
	customUrl?: string;
	thumbnail?: string;
	albumType?: 'single' | 'album' | 'ep';
	createdAt: Date;
	updatedAt: Date;
	// Multiple platform support
	spotify?: string;
	appleMusic?: string;
	youtube?: string;
	soundcloud?: string;
	audiomack?: string;
	boomplay?: string;
	anghami?: string;
	napster?: string;
	bandcamp?: string;
	tidal?: string;
	deezer?: string;
	amazonMusic?: string;
	beatport?: string;
	musicbed?: string;
	platforms?: Array<{ id: string; name: string; url: string }>;
	additionalPlatforms?: Array<{ name: string; url: string }>;
	// Pre-release fields
	upc?: string | null;
	isrc?: string | null;
	isPreRelease?: boolean;
	requiresPassword?: boolean;
	requiresEmailCapture?: boolean;
	passwordHash?: string | null;
	expiresAt?: Date | null;
	accessType?: 'stream_only' | 'downloadable' | 'both' | null;
	audioFileUrl?: string | null;
	audioFileCloudinaryId?: string | null;
	maxAccessCount?: number | null;
	accessCount?: number;
	// Pre-order / Buy fields
	buyPrice?: number | null;
	buyCurrency?: string;
	buyEnabled?: boolean;
	passcodeUsageLimit?: number | null; // null = unlimited; for shared passcodes only
	sortOrder?: number;
	isArchived?: boolean;
}
