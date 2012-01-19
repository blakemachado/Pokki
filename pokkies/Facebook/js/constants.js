/**
 * Facebook Pokki / constants.js
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     2.1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */

var DEBUG = false;              // enable / disable debug messages
var GA_ENABLED = false;         // enable / disable Google Analytics
var FB_API_KEY = 'fb_api_key';  // scrambled data key
var FB_APP_ID = 'fb_app_id';    // scrambled data key

// DOM IDs for tabs
var TABS = {
    DEFAULT_TAB: 'tab-news_feed',
    NEWS_FEED: 'tab-news_feed',
    FRIEND_REQUESTS: 'tab-friend_requests',
    MESSAGES: 'tab-messages',
    NOTIFICATIONS: 'tab-notifications'
};

// DOM IDs for content
var CONTENT = {
    MAIN: 'content',
    WRAPPER: 'wrapper',
    NEWS_FEED: 'content-news_feed',
    FRIEND_REQUESTS: 'content-friend_requests',
    MESSAGES: 'content-messages',
    NOTIFICATIONS: 'content-notifications'
};

// Local storage keys
var KEYS = {
    FB_ACCESS_TOKEN: 'fb_access_token',
    FB_USER: 'fb_user',
    ACTIVE_TAB: 'active_tab',
    
    UNREAD_MSG_COUNT_DISPLAY: 'fb_unread_msgs_display', // separate key so display is persistant
    UNREAD_MESSAGES: 'fb_unread_msgs',
    UNREAD_MESSAGE_IDS: 'fb_unread_msg_ids',
    UNREAD_FRIEND_REQUESTS: 'fb_unread_friend_requests',
    UNREAD_NOTIFICATIONS: 'fb_unread_notifications',
    
    NEWS_FEED_CACHE: 'fb_nf_cache',
    FRIEND_REQUESTS_CACHE: 'fb_fr_cache',
    MESSAGES_CACHE: 'fb_ms_cache',
    NOTIFICATIONS_CACHE: 'fb_nt_cache',
    
    FRIEND_REQUESTS_SEEN: 'fb_fr_seen',
    LAST_MESSAGE_SEEN: 'fb_ms_badge_time',
    
    PERMISSIONS: 'fb_permissions',
    FIRST_RUN: 'fb_first_run',
    FIRST_CONNECTED: 'fb_first_connected'
};

// DOM IDs for 'More' links
var MORE = {
    NEWS_FEED: 'newsfeed_more',
    MESSAGES: 'messages_more',
    FRIEND_REQUESTS: 'friend_requests_more',
    NOTIFICATIONS: 'notifications_more'
};

// Loading image used with MooTools LazyLoad library
LAZYLOAD_IMAGE = 'img/image-loading.png';