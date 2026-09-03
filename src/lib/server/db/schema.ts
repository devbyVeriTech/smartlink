import {
	pgTable,
	text,
	timestamp,
	boolean,
	integer,
	json,
	decimal,
	pgEnum,
	index,
	uniqueIndex
} from 'drizzle-orm/pg-core';

export const userTypeEnum = pgEnum('user_type', [
	'admin',
	'moderator',
	'author',
	'musician',
	'listener',
	'label'
]);

export const preReleaseAccessTypeEnum = pgEnum('pre_release_access_type', [
	'stream_only',
	'downloadable',
	'both'
]);

export const blogPostStatusEnum = pgEnum('blog_post_status', ['draft', 'published', 'scheduled']);

export const users = pgTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash'),
	name: text('name').notNull(),
	username: text('username').unique(),
	userType: userTypeEnum('user_type').notNull().default('musician'),
	accountType: text('account_type').default('individual'), // 'individual' | 'label'
	bio: text('bio'),
	avatar: text('avatar'),
	banner: text('banner'),
	location: text('location'),
	website: text('website'),
	socialLinks: json('social_links'), // { twitter, instagram, spotify, etc. }
	genre: text('genre'),
	instruments: text('instruments'),
	experience: text('experience'), // 'beginner' | 'intermediate' | 'advanced' | 'professional'
	favoriteGenres: json('favorite_genres'), // JSON array for listener's favorite genres
	interests: text('interests'), // listener's primary goal/interests
	isPremium: boolean('is_premium').default(false),
	freeTrialStartedAt: timestamp('free_trial_started_at'),
	freeTrialPlan: text('free_trial_plan'),
	paystackCustomerId: text('paystack_customer_id'),
	verificationStatus: text('verification_status').default('none'), // 'none' | 'pending' | 'verified' | 'rejected'
	verificationDate: timestamp('verification_date'),
	verificationDocuments: json('verification_documents'),
	adminNotes: text('admin_notes'),
	lastAdminReviewAt: timestamp('last_admin_review_at'),
	profileVisibility: text('profile_visibility').default('public'), // 'public' | 'private' | 'unlisted'
	profileSettings: json('profile_settings'), // { showEmailPublicly, analyticsSharing }
	twoFactorEnabled: boolean('two_factor_enabled').default(false),
	notificationPreferences: json('notification_preferences'),
	appearanceSettings: json('appearance_settings'),
	themePreferences: json('theme_preferences'),
	onboardingCompleted: boolean('onboarding_completed').default(false),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const sessions = pgTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		expiresAt: timestamp('expires_at').notNull()
	},
	(table) => [
		index('sessions_user_id_idx').on(table.userId),
		index('sessions_expires_at_idx').on(table.expiresAt)
	]
);

export const otpCodes = pgTable('otp_codes', {
	id: text('id').primaryKey(),
	email: text('email').notNull(),
	codeHash: text('code_hash').notNull(), // Hashed OTP for security
	userId: text('user_id').references(() => users.id), // Optional: link to user if exists
	purpose: text('purpose').notNull(), // 'email_verification', 'password_reset', 'login'
	expiresAt: timestamp('expires_at').notNull(),
	used: boolean('used').default(false),
	attempts: integer('attempts').default(0),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const oauthAccounts = pgTable('oauth_accounts', {
	provider: text('provider').notNull(),
	providerUserId: text('provider_user_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id)
});

export const links = pgTable(
	'links',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		artistId: text('artist_id').references(() => musicians.id), // Link to specific artist profile
		title: text('title').notNull(),
		artist: text('artist').notNull(),
		slug: text('slug').notNull().unique(),
		description: text('description'),
		artwork: text('artwork'),
		cloudinaryPublicId: text('cloudinary_public_id'),
		cloudinaryUrl: text('cloudinary_url'),
		thumbnail: text('thumbnail'),
		genre: text('genre'),
		albumType: text('album_type'), // 'single' | 'album' | 'ep'
		tags: text('tags'), // JSON array of strings
		url: text('url').notNull(),
		customUrl: text('custom_url').unique(),
		isPublic: boolean('is_public').default(true),
		isFeatured: boolean('is_featured').default(false),
		featuredOrder: integer('featured_order').default(0),
		verificationInherited: boolean('verification_inherited').default(false), // Inherits artist verification
		featuredByLabel: boolean('featured_by_label').default(false),
		labelPriority: integer('label_priority').default(0),
		labelMetadata: json('label_metadata'), // Label-specific data
		contentRating: text('content_rating').default('general'), // 'general', 'mature', 'explicit'
		language: text('language').default('en'),
		visibility: text('visibility').default('public'), // 'public', 'private', 'unlisted'
		thumbnailGeneratedAt: timestamp('thumbnail_generated_at'),
		clicks: integer('clicks').default(0),
		uniqueClicks: integer('unique_clicks').default(0),
		// Platform URLs
		spotify: text('spotify'),
		appleMusic: text('apple_music'),
		youtube: text('youtube'),
		soundcloud: text('soundcloud'),
		additionalPlatforms: json('additional_platforms'), // JSON array of {name, url}
		platforms: json('platforms'), // JSON array of {id, name, url} for ordered platforms
		// Pre-release fields
		upc: text('upc'),
		isrc: text('isrc'),
		isPreRelease: boolean('is_pre_release').default(false),
		requiresPassword: boolean('requires_password').default(false),
		passwordHash: text('password_hash'),
		expiresAt: timestamp('expires_at'),
		requiresEmailCapture: boolean('requires_email_capture').default(false),
		accessType: preReleaseAccessTypeEnum('access_type'), // 'stream_only', 'downloadable', 'both'
		audioFileUrl: text('audio_file_url'),
		audioFileCloudinaryId: text('audio_file_cloudinary_id'),
		maxAccessCount: integer('max_access_count'),
		accessCount: integer('access_count').default(0),
		// Pre-order / Buy fields
		buyPrice: integer('buy_price'), // Price in kobo
		buyCurrency: text('buy_currency').default('NGN'),
		buyEnabled: boolean('buy_enabled').default(false),
		passcodeUsageLimit: integer('passcode_usage_limit'), // null = unlimited; for shared passcodes only
		sortOrder: integer('sort_order').default(0),
		isArchived: boolean('is_archived').default(false),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		index('links_user_id_idx').on(table.userId),
		index('links_updated_at_idx').on(table.updatedAt)
	]
);

// Social Features Tables
export const follows = pgTable(
	'follows',
	{
		id: text('id').primaryKey(),
		followerId: text('follower_id')
			.notNull()
			.references(() => users.id),
		followingId: text('following_id')
			.notNull()
			.references(() => users.id),
		status: text('status').notNull().default('active'), // 'active', 'blocked'
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [
		index('follows_follower_id_idx').on(table.followerId),
		index('follows_following_id_idx').on(table.followingId)
	]
);

export const userBlocks = pgTable('user_blocks', {
	id: text('id').primaryKey(),
	blockerId: text('blocker_id')
		.notNull()
		.references(() => users.id),
	blockedId: text('blocked_id')
		.notNull()
		.references(() => users.id),
	reason: text('reason'),
	createdAt: timestamp('created_at').defaultNow()
});

export const socialLinks = pgTable('social_links', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	platform: text('platform').notNull(), // 'twitter', 'instagram', 'spotify', etc.
	url: text('url').notNull(),
	verified: boolean('verified').default(false),
	displayOrder: integer('display_order').default(0),
	isPrimary: boolean('is_primary').default(false),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const activities = pgTable(
	'activities',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		activityType: text('activity_type').notNull(), // 'link_created', 'link_shared', 'follow', 'verification_earned', etc.
		targetId: text('target_id'), // ID of the related object
		targetType: text('target_type'), // 'link', 'user', 'artist', etc.
		metadata: json('metadata'), // Additional activity data
		visibility: text('visibility').notNull().default('public'), // 'public', 'followers', 'private'
		engagementCount: integer('engagement_count').default(0),
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [index('activities_user_id_created_at_idx').on(table.userId, table.createdAt)]
);

export const activitySaves = pgTable(
	'activity_saves',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		activityId: text('activity_id')
			.notNull()
			.references(() => activities.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [
		index('activity_saves_user_id_idx').on(table.userId),
		index('activity_saves_activity_id_idx').on(table.activityId),
		uniqueIndex('activity_saves_user_activity_unique').on(table.userId, table.activityId)
	]
);

export const likes = pgTable('likes', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	targetId: text('target_id').notNull(),
	targetType: text('target_type').notNull(), // 'link', 'activity', 'comment'
	createdAt: timestamp('created_at').defaultNow()
});

export const comments = pgTable('comments', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	targetId: text('target_id').notNull(),
	targetType: text('target_type').notNull(), // 'link', 'activity'
	parentId: text('parent_id').references((): any => comments.id), // For threaded comments
	content: text('content').notNull(),
	isEdited: boolean('is_edited').default(false),
	likesCount: integer('likes_count').default(0),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const shares = pgTable('shares', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	linkId: text('link_id')
		.notNull()
		.references(() => links.id),
	platform: text('platform').notNull(), // 'twitter', 'facebook', 'whatsapp', etc.
	shareUrl: text('share_url'),
	clicksGenerated: integer('clicks_generated').default(0),
	createdAt: timestamp('created_at').defaultNow()
});

export const analytics = pgTable(
	'analytics',
	{
		id: text('id').primaryKey(),
		linkId: text('link_id')
			.notNull()
			.references(() => links.id),
		clickId: text('click_id').notNull(),
		sessionId: text('session_id'),
		ip: text('ip'),
		userAgent: text('user_agent'),
		deviceType: text('device_type'), // 'mobile', 'desktop', 'tablet'
		browser: text('browser'),
		country: text('country'),
		city: text('city'),
		referer: text('referer'),
		refererType: text('referer_type'), // 'direct', 'search', 'social', etc.
		utmSource: text('utm_source'),
		utmMedium: text('utm_medium'),
		utmCampaign: text('utm_campaign'),
		geographicData: json('geographic_data'), // Detailed location data
		platform: text('platform'), // 'spotify', 'apple_music', etc.
		timestamp: timestamp('timestamp').defaultNow()
	},
	(table) => [index('analytics_link_id_timestamp_idx').on(table.linkId, table.timestamp)]
);

// Content Management Tables
export const blogPosts = pgTable('blog_posts', {
	id: text('id').primaryKey(),
	authorId: text('author_id')
		.notNull()
		.references(() => users.id),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	content: text('content').notNull(),
	excerpt: text('excerpt'),
	featuredImage: text('featured_image'),
	status: blogPostStatusEnum('status').notNull().default('draft'),
	categoryId: text('category_id').references(() => blogCategories.id),
	tags: json('tags'), // JSON array of tags
	seoData: json('seo_data'), // SEO metadata
	publishedAt: timestamp('published_at'),
	viewsCount: integer('views_count').default(0),
	likesCount: integer('likes_count').default(0),
	bookmarksCount: integer('bookmarks_count').default(0),
	commentsCount: integer('comments_count').default(0),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const blogCategories: any = pgTable('blog_categories', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	description: text('description'),
	parentId: text('parent_id').references((): any => blogCategories.id),
	postCount: integer('post_count').default(0),
	isActive: boolean('is_active').default(true),
	sortOrder: integer('sort_order').default(0),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const blogPostLikes = pgTable('blog_post_likes', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	blogPostId: text('blog_post_id')
		.notNull()
		.references(() => blogPosts.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').defaultNow()
});

export const blogPostBookmarks = pgTable('blog_post_bookmarks', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	blogPostId: text('blog_post_id')
		.notNull()
		.references(() => blogPosts.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').defaultNow()
});

export const mediaAssets = pgTable('media_assets', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	filename: text('filename').notNull(),
	originalName: text('original_name').notNull(),
	fileType: text('file_type').notNull(), // 'image', 'video', 'audio', 'document'
	fileSize: integer('file_size').notNull(),
	mimeType: text('mime_type'),
	storagePath: text('storage_path').notNull(),
	cdnUrl: text('cdn_url'),
	isPublic: boolean('is_public').default(false),
	metadata: json('metadata'), // EXIF data, dimensions, etc.
	uploadedAt: timestamp('uploaded_at').defaultNow()
});

export const mediaKits = pgTable('media_kits', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	title: text('title').notNull(),
	description: text('description'),
	assets: json('assets'), // Array of media asset IDs
	downloadUrl: text('download_url'),
	isPublic: boolean('is_public').default(false),
	accessCount: integer('access_count').default(0),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// Financial & Transaction Tables
export const transactions = pgTable(
	'transactions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		type: text('type').notNull(), // 'earning', 'withdrawal', 'refund', 'bonus', 'fee'
		amount: integer('amount').notNull(),
		currency: text('currency').notNull().default('NGN'),
		status: text('status').notNull().default('pending'), // 'pending', 'completed', 'failed', 'cancelled'
		paymentMethod: text('payment_method'), // 'bank', 'card', 'flutterwave', 'wallet'
		referenceId: text('reference_id').unique(), // Related withdrawal, link, etc.
		description: text('description'),
		metadata: json('metadata'),
		createdAt: timestamp('created_at').defaultNow(),
		processedAt: timestamp('processed_at')
	},
	(table) => [index('transactions_user_id_created_at_idx').on(table.userId, table.createdAt)]
);

export const earnings = pgTable(
	'earnings',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		linkId: text('link_id').references(() => links.id),
		clickId: text('click_id').references(() => analytics.id),
		amount: integer('amount').notNull(),
		currency: text('currency').notNull().default('NGN'),
		ratePerClick: integer('rate_per_click').notNull(),
		date: text('date').notNull(), // YYYY-MM-DD format
		status: text('status').notNull().default('pending'), // 'pending', 'confirmed', 'paid'
		withdrawalId: text('withdrawal_id').references(() => withdrawals.id),
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [
		index('earnings_user_id_date_idx').on(table.userId, table.date),
		index('earnings_link_id_idx').on(table.linkId)
	]
);

export const paymentMethods = pgTable('payment_methods', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	type: text('type').notNull(), // 'bank', 'card', 'mobile_money'
	provider: text('provider').notNull(), // 'flutterwave', 'stripe', etc.
	accountDetails: json('account_details').notNull(), // Encrypted account info
	isDefault: boolean('is_default').default(false),
	isVerified: boolean('is_verified').default(false),
	verificationStatus: text('verification_status').default('pending'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// Subscription & Premium Tables
export const subscriptionPlans = pgTable('subscription_plans', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	price: integer('price').notNull(), // Price in cents (e.g., 249 for $2.49)
	currency: text('currency').notNull().default('USD'),
	prices: json('prices'), // Per-currency prices in minor units, e.g. {NGN:399900, GHS:3600, USD:330}
	billingInterval: text('billing_interval').notNull(), // 'month', 'year'
	trialPeriodDays: integer('trial_period_days').default(0), // Trial period in days
	paystackPriceCode: text('paystack_price_code').unique(), // Paystack price code for payments
	features: json('features'), // JSON array of plan features
	highlights: json('highlights'), // JSON array of key highlights for display
	isActive: boolean('is_active').default(true),
	isPopular: boolean('is_popular').default(false), // For highlighting popular plans
	sortOrder: integer('sort_order').default(0),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const usageLimits = pgTable('usage_limits', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	limitType: text('limit_type').notNull(), // 'links', 'analytics', 'withdrawals'
	currentUsage: integer('current_usage').notNull(),
	maxLimit: integer('max_limit').notNull(),
	resetDate: timestamp('reset_date'),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// Notification & Communication Tables
export const notifications = pgTable(
	'notifications',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		type: text('type').notNull(), // 'follow', 'like', 'comment', 'verification', 'payment'
		title: text('title').notNull(),
		content: text('content').notNull(),
		isRead: boolean('is_read').default(false),
		priority: text('priority').default('normal'), // 'low', 'normal', 'high', 'urgent'
		actionUrl: text('action_url'),
		actionData: json('action_data'),
		createdAt: timestamp('created_at').defaultNow(),
		readAt: timestamp('read_at')
	},
	(table) => [index('notifications_user_id_is_read_idx').on(table.userId, table.isRead)]
);

export const emailPreferences = pgTable('email_preferences', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	notificationType: text('notification_type').notNull(), // 'marketing', 'security', 'social', 'payments'
	isEnabled: boolean('is_enabled').default(true),
	updatedAt: timestamp('updated_at').defaultNow()
});

// System & Admin Tables
export const adminActions = pgTable('admin_actions', {
	id: text('id').primaryKey(),
	adminUserId: text('admin_user_id')
		.notNull()
		.references(() => users.id),
	action: text('action').notNull(), // 'verify_artist', 'suspend_user', 'approve_content'
	targetType: text('target_type').notNull(), // 'artist', 'user', 'link', 'post'
	targetId: text('target_id').notNull(),
	actionDetails: json('action_details'),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at').defaultNow()
});

export const verificationAuditLog = pgTable('verification_audit_log', {
	id: text('id').primaryKey(),
	artistId: text('artist_id')
		.notNull()
		.references(() => musicians.id),
	action: text('action').notNull(), // 'submitted', 'approved', 'rejected', 'appealed'
	oldStatus: text('old_status'),
	newStatus: text('new_status'),
	changedBy: text('changed_by').references(() => users.id),
	reason: text('reason'),
	createdAt: timestamp('created_at').defaultNow()
});

export const referralCodes = pgTable('referral_codes', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	code: text('code').notNull().unique(),
	uses: integer('uses').default(0),
	maxUses: integer('max_uses'),
	rewardAmount: integer('reward_amount').notNull(),
	currency: text('currency').notNull().default('NGN'),
	expiresAt: timestamp('expires_at'),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at').defaultNow()
});

export const apiKeys = pgTable(
	'api_keys',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		name: text('name').notNull(),
		keyHash: text('key_hash').notNull(),
		permissions: json('permissions'), // Array of allowed actions
		lastUsedAt: timestamp('last_used_at'),
		expiresAt: timestamp('expires_at'),
		isActive: boolean('is_active').default(true),
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [index('api_keys_user_id_idx').on(table.userId)]
);

export const subscriptions = pgTable(
	'subscriptions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		paystackSubscriptionCode: text('paystack_subscription_code').unique(),
		paystackCustomerCode: text('paystack_customer_code'),
		status: text('status').notNull(), // 'active', 'canceled', 'past_due', etc.
		plan: text('plan').notNull(), // 'basic', 'pro', etc.
		billingInterval: text('billing_interval').default('month'), // 'month' | 'year'
		currentPeriodStart: timestamp('current_period_start'),
		currentPeriodEnd: timestamp('current_period_end'),
		cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
		renewalReminderSentAt: timestamp('renewal_reminder_sent_at'),
		expiryNotifiedAt: timestamp('expiry_notified_at'),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		index('subscriptions_user_id_idx').on(table.userId),
		index('subscriptions_status_idx').on(table.status)
	]
);

export const withdrawals = pgTable('withdrawals', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	amount: integer('amount').notNull(),
	currency: text('currency').notNull().default('NGN'),
	status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
	bankAccount: json('bank_account').notNull(), // { accountNumber, accountName, bankName, bankCode, routingNumber }
	reason: text('reason'),
	transactionReference: text('transaction_reference'), // Flutterwave transfer reference
	failedReason: text('failed_reason'),
	processingFee: integer('processing_fee').default(0),
	taxWithheld: integer('tax_withheld').default(0),
	bankVerificationStatus: text('bank_verification_status').default('pending'),
	processedAt: timestamp('processed_at'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// Artist Management Tables
export const musicians = pgTable('musicians', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	artistName: text('artist_name').notNull(),
	slug: text('slug').notNull().unique(),
	bio: text('bio'),
	avatar: text('avatar'),
	banner: text('banner'),
	artistType: text('artist_type').notNull().default('solo'), // 'solo', 'band', 'producer', 'dj', 'label'
	primaryGenre: text('primary_genre'),
	secondaryGenres: json('secondary_genres'), // JSON array of genres
	recordLabel: text('record_label'),
	yearsActive: text('years_active'),
	equipmentSoftware: json('equipment_software'), // JSON array of equipment/software
	verificationStatus: text('verification_status').notNull().default('not_submitted'), // 'not_submitted', 'pending', 'verified', 'rejected'
	verificationCriteriaMet: json('verification_criteria_met'), // JSON object tracking criteria fulfillment
	verifiedAt: timestamp('verified_at'),
	verifiedBy: text('verified_by'), // Admin user ID
	verificationDocuments: json('verification_documents'),
	rejectionReason: text('rejection_reason'),
	canReapplyAt: timestamp('can_reapply_at'),
	socialVerification: json('social_verification'), // JSON of verified social accounts
	isFeatured: boolean('is_featured').default(false),
	featuredOrder: integer('featured_order').default(0),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const artistManagers = pgTable('artist_managers', {
	id: text('id').primaryKey(),
	artistId: text('artist_id')
		.notNull()
		.references(() => musicians.id),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	role: text('role').notNull().default('viewer'), // 'owner', 'manager', 'viewer'
	permissions: json('permissions'), // Granular permissions object
	invitedBy: text('invited_by').references(() => users.id),
	invitedAt: timestamp('invited_at'),
	joinedAt: timestamp('joined_at'),
	status: text('status').notNull().default('pending'), // 'pending', 'active', 'removed'
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const verificationSubmissions = pgTable('verification_submissions', {
	id: text('id').primaryKey(),
	artistId: text('artist_id')
		.notNull()
		.references(() => musicians.id),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	submissionType: text('submission_type').notNull().default('initial'), // 'initial', 'renewal', 'appeal'
	documents: json('documents'), // Uploaded verification documents
	socialAccounts: json('social_accounts'), // Social media verification data
	criteriaData: json('criteria_data'), // Followers, clicks, activity metrics at time of submission
	status: text('status').notNull().default('pending'), // 'pending', 'under_review', 'approved', 'rejected'
	reviewedBy: text('reviewed_by').references(() => users.id),
	reviewedAt: timestamp('reviewed_at'),
	adminNotes: text('admin_notes'),
	rejectionReasons: json('rejection_reasons'),
	submittedAt: timestamp('submitted_at').defaultNow(),
	expiresAt: timestamp('expires_at'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const verificationCriteria = pgTable('verification_criteria', {
	id: text('id').primaryKey(),
	criteriaName: text('criteria_name').notNull(), // 'followers', 'clicks', 'activity'
	thresholdValue: integer('threshold_value').notNull(),
	timePeriodMonths: integer('time_period_months').notNull(),
	isActive: boolean('is_active').default(true),
	weight: integer('weight').default(1), // Weight for scoring system
	description: text('description'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const labels = pgTable('labels', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	labelName: text('label_name').notNull(),
	slug: text('slug').notNull().unique(),
	description: text('description'),
	logo: text('logo'),
	banner: text('banner'),
	website: text('website'),
	establishedYear: integer('established_year'),
	location: text('location'),
	verificationStatus: text('verification_status').default('not_submitted'),
	verifiedAt: timestamp('verified_at'),
	financialSettings: json('financial_settings'), // { defaultRoyaltySplit, automaticPayouts, taxId }
	notificationPreferences: json('notification_preferences'), // { catalogAlerts, securityAlerts }
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const activityLogs = pgTable(
	'activity_logs',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		type: text('type').notNull(), // 'login', 'label_update', etc.
		ip: text('ip'),
		userAgent: text('user_agent'),
		device: text('device'),
		meta: json('meta'),
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [index('activity_logs_user_id_created_at_idx').on(table.userId, table.createdAt)]
);

export const promotions = pgTable('promotions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	promotionType: text('promotion_type').notNull(), // 'homepage_featured', 'search_boosted', 'profile_highlighted', 'social_media'
	targetType: text('target_type').notNull(), // 'link', 'artist_profile', 'label_profile'
	targetId: text('target_id').notNull(),
	status: text('status').notNull().default('pending'), // 'pending', 'active', 'completed', 'cancelled'
	startDate: timestamp('start_date'),
	endDate: timestamp('end_date'),
	durationDays: integer('duration_days').notNull(),
	amount: integer('amount').notNull(),
	currency: text('currency').notNull().default('NGN'),
	paymentReference: text('payment_reference'),
	paymentStatus: text('payment_status').notNull().default('pending'), // 'pending', 'paid', 'failed'
	metadata: json('metadata'),
	views: integer('views').default(0),
	clicks: integer('clicks').default(0),
	engagementRate: decimal('engagement_rate'),
	conversionRate: decimal('conversion_rate'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const labelArtists = pgTable('label_artists', {
	id: text('id').primaryKey(),
	labelId: text('label_id')
		.notNull()
		.references(() => labels.id),
	artistId: text('artist_id')
		.notNull()
		.references(() => musicians.id),
	relationshipType: text('relationship_type').notNull().default('managed'), // 'signed', 'distributed', 'managed'
	contractDetails: json('contract_details'),
	revenueSplitPercentage: integer('revenue_split_percentage').default(50),
	startDate: timestamp('start_date'),
	endDate: timestamp('end_date'),
	status: text('status').notNull().default('active'), // 'active', 'terminated', 'expired'
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const preReleaseEmails = pgTable(
	'pre_release_emails',
	{
		id: text('id').primaryKey(),
		linkId: text('link_id')
			.notNull()
			.references(() => links.id, { onDelete: 'cascade' }),
		email: text('email').notNull(),
		name: text('name'),
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [index('pre_release_emails_link_id_idx').on(table.linkId)]
);

export const preReleaseAccessLog = pgTable(
	'pre_release_access_log',
	{
		id: text('id').primaryKey(),
		linkId: text('link_id')
			.notNull()
			.references(() => links.id, { onDelete: 'cascade' }),
		visitorKey: text('visitor_key').notNull(),
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [index('pre_release_access_log_link_visitor_idx').on(table.linkId, table.visitorKey)]
);

export const passcodes = pgTable(
	'passcodes',
	{
		id: text('id').primaryKey(),
		linkId: text('link_id')
			.notNull()
			.references(() => links.id, { onDelete: 'cascade' }),
		email: text('email'), // null for shared passcodes; set for bought tracks
		passcode_hash: text('passcode_hash').notNull(),
		is_used: boolean('is_used').notNull().default(false),
		used_at: timestamp('used_at'),
		usage_limit: integer('usage_limit'), // null = unlimited; for shared passcodes
		current_uses: integer('current_uses').notNull().default(0),
		created_at: timestamp('created_at').defaultNow(),
		expires_at: timestamp('expires_at')
	},
	(table) => [
		index('passcodes_link_id_idx').on(table.linkId),
		index('passcodes_email_idx').on(table.email)
	]
);

export const merchProducts = pgTable('merch_products', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	name: text('name').notNull(),
	description: text('description'),
	price: integer('price').notNull(), // Price in kobo/cents
	currency: text('currency').notNull().default('NGN'),
	imageUrl: text('image_url'),
	productUrl: text('product_url'), // External store link (optional)
	isAvailable: boolean('is_available').default(true),
	isDeleted: boolean('is_deleted').default(false),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

export const orders = pgTable(
	'orders',
	{
		id: text('id').primaryKey(),
		sellerUserId: text('seller_user_id')
			.notNull()
			.references(() => users.id),
		productId: text('product_id').references(() => merchProducts.id),
		linkId: text('link_id').references(() => links.id),
		buyerEmail: text('buyer_email').notNull(),
		buyerName: text('buyer_name'),
		buyerPhone: text('buyer_phone'),
		buyerAddress: text('buyer_address'),
		quantity: integer('quantity').notNull().default(1),
		unitPrice: integer('unit_price').notNull(), // Price in kobo at time of purchase
		subTotal: integer('sub_total').notNull(), // unitPrice * quantity
		platformFee: integer('platform_fee').notNull(), // Platform cut in kobo
		artistPayout: integer('artist_payout').notNull(), // Seller net in kobo
		currency: text('currency').notNull().default('NGN'),
		productSnapshot: json('product_snapshot'), // { name, description, price, imageUrl } at purchase time
		status: text('status').notNull().default('pending'), // 'pending', 'paid', 'shipped', 'cancelled', 'refunded'
		paymentReference: text('payment_reference'),
		paymentChannel: text('payment_channel'),
		createdAt: timestamp('created_at').defaultNow(),
		paidAt: timestamp('paid_at')
	},
	(table) => [
		index('orders_seller_user_id_idx').on(table.sellerUserId),
		index('orders_payment_reference_idx').on(table.paymentReference)
	]
);

export const faqs = pgTable('faqs', {
	id: text('id').primaryKey(),
	question: text('question').notNull(),
	answer: text('answer').notNull(),
	sortOrder: integer('sort_order').default(0),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});
