/**
 * Facebook Pokki / constants.js
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     2.1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * 				Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */


var FB_API_KEY = 'fb_api_key';
var FB_APP_ID = 'fb_app_id';
var DEBUG = true;				// enable / disable debug messages
var GA_ENABLED = true;			// enable / disable Google Analytics tracking

var CHROME = {
	WIDTH: 670,					// define default pokki width for websheet
	HEIGHT: 415					// define default pokki height for websheet
};

// DOM IDs for section menu tabs
var TABS = {
	DEFAULT_TAB: 'nav-news_feed',
	NEWS_FEED: 'nav-news_feed',
	FRIEND_REQUESTS: 'nav-friends',
	NOTIFICATIONS: 'nav-notifications',
	MESSAGES: 'nav-messages',
	EVENTS: 'nav-events',
	SEARCH: 'nav-search',
	SEARCH_FIELD: 'search_field'
};

// DOM IDs for sections content
var MAIN = {
	DEFAULT: 'news_feed-main',
	SEARCH_RESULTS: 'search-main',
	NEWS_FEED: 'news_feed-main',
	NOTIFICATIONS: 'notifications-main',
	MESSAGES: 'messages-main',
	EVENTS: 'events-main',
	FRIEND_REQUESTS: 'friend_requests-main'
};

// DOM IDs for content elements
var CONTENT = {
	SPLASH: 'splash',
	MAIN: 'content',
	SUBMAIN: 'sub-main',
	WRAPPER: 'wrapper',
	NAV_MENU_ITEMS: '#nav_menu li',
	NEWS_FEED: 'content-news_feed',
	FRIEND_REQUESTS: 'content-friend_requests',
	MESSAGES: 'content-messages',
	NOTIFICATIONS: 'content-notifications',
	EVENTS: 'content-events',
	SEARCH_RESULTS: 'content-search_results',
	THREAD: 'subcontent-thread',
	EVENT: 'subcontent-event',
	QUICKLIST: 'quicklist',
	SHOW_SUBCONTENT_ITEMS: '.content .show_subcontent',
	PERMISSIONS: 'permissions-content'
};

// Local storage keys
var KEYS = {
	FB_ACCESS_TOKEN: 'fb_access_token',
	FB_USER: 'fb_user',
	ACTIVE_TAB: 'active_tab',

	UNREAD_MSG_COUNT_DISPLAY: 'fb_unread_msgs_display',		// separate key so display is persistant
	UNREAD_MESSAGES: 'fb_unread_msgs',
	UNREAD_MESSAGE_IDS: 'fb_unread_msg_ids',
	UNREAD_FRIEND_REQUESTS: 'fb_unread_friend_requests',
	UNREAD_NOTIFICATIONS: 'fb_unread_notifications',
	UNREAD_EVENTS: 'fb_unread_events',

	NEWS_FEED_CACHE: 'fb_nf_cache',
	FRIEND_REQUESTS_CACHE: 'fb_fr_cache',
	MESSAGES_CACHE: 'fb_ms_cache',
	NOTIFICATIONS_CACHE: 'fb_nt_cache',
	EVENTS_CACHE: 'fb_ev_cache',
	EVENT_INVITEES_CACHE: 'fb_ev_invitees_cache',

	FRIEND_REQUESTS_SEEN: 'fb_fr_seen',
	LAST_MESSAGE_SEEN: 'fb_ms_badge_time',

	PERMISSIONS: 'fb_permissions',
	FIRST_RUN: 'fb_first_run',
	FIRST_CONNECTED: 'fb_first_connected',

	FRIENDS: 'fb_friends',

	NEWS_FEED_PAGINATION: 'fb_nf_pagination'
};

// DOM IDs for "more" links
var MORE = {
	NEWS_FEED: 'newsfeed_more',
	MESSAGES: 'messages_more',
	FRIEND_REQUESTS: 'friend_requests_more',
	NOTIFICATIONS: 'notifications_more',
	EVENTS: 'events_more',
	THREAD_REPLY: 'thread_reply',
	EVENT: 'event_more',
	SEARCH_RESULTS: 'search_results_more'
};

// Loading image used with MooTools LazyLoad library
LAZYLOAD_IMAGE = 'img/loading.gif';