/**
 * Facebook Pokki / background.js - background javascript file
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */

// LocalStore objects
var BG = {
    user:                   new LocalStore(KEYS.FB_USER, {scrambled: true}),
    access_token:           new LocalStore(KEYS.FB_ACCESS_TOKEN, {scrambled: true}),
    last_msg_seen:          new LocalStore(KEYS.LAST_MESSAGE_SEEN, {defaultVal: 0}),
    newsfeed_cache:         new LocalStore(KEYS.NEWS_FEED_CACHE),
    friend_req_cache:       new LocalStore(KEYS.FRIEND_REQUESTS_CACHE, {defaultVal: []}),
    notifications_cache:    new LocalStore(KEYS.NOTIFICATIONS_CACHE),
    messages_cache:         new LocalStore(KEYS.MESSAGES_CACHE),
    friend_req_seen:        new LocalStore(KEYS.FRIEND_REQUESTS_SEEN),
    unread_messages:        new LocalStore(KEYS.UNREAD_MESSAGES, {defaultVal: 0}),
    unread_msg_display:     new LocalStore(KEYS.UNREAD_MSG_COUNT_DISPLAY, {defaultVal: 0}),
    unread_friend_req:      new LocalStore(KEYS.UNREAD_FRIEND_REQUESTS, {defaultVal: 0}),
    unread_msg_ids:         new LocalStore(KEYS.UNREAD_MESSAGE_IDS),
    unread_notifications:   new LocalStore(KEYS.UNREAD_NOTIFICATIONS, {defaultVal: 0}),
    permissions:            new LocalStore(KEYS.PERMISSIONS)
};

// Some Globals...
var numMax = 999;
var permissions_timer = '';
var nf_timer = '';
var no_timer = '';
var ms_timer = '';
var fr_timer = '';

/**
 * Newsfeed Poller
 */
var nf_updater = function() {
    if(BG.access_token.get() && BG.user.get()) { 
        // update newsfeed cache
        var r = new Request.JSONP({
            url: 'https://graph.facebook.com/me/home',
            data: {
                access_token: BG.access_token.get()
            },
            onComplete: function(resp) {
                if( ! resp.error) {
                    // save to cache
                    BG.newsfeed_cache.set(resp.data);
                    
                    if(! pokki.isPopupShown()) {
                        // update popup in background
                        pokki.rpc('update_news_feed();');
                    }
                }
            }
        }).send();
    }
    else {
        stop_badge_poll();
    }
};

/**
 * Notifications Poller
 */
var no_updater = function() {
    if(BG.access_token.get() && BG.user.get()) { 
        // update notifications cache
        var r = new Request.JSONP({
            url: 'https://api.facebook.com/method/notifications.getList',
            data: {
                include_read: true,
                access_token: BG.access_token.get(),
                format: 'json'
            },
            onComplete: function(resp) {
                if( ! resp.error_code) { 
                    BG.notifications_cache.set(resp.notifications);
                    // update popup in background
                    pokki.rpc('update_notifications();');
                    
                    // count the unread notifications
                    // we don't have to worry about comparing notifications because clicking on
                    // the notifications tab pings facebook to tell them the unread notifications
                    // have been viewed
                    var no = resp.notifications;
                    var num_unread = 0;
                    for(var i = 0; i < no.length; i++) {
                        if(no[i].is_unread) {
                            num_unread += 1;
                        }
                    }
                    
                    BG.unread_notifications.set(num_unread);
                    
                    refresh_badge_count();
                    // tell popup to update tab badges
                    pokki.rpc('update_badges();');
                }
            }
        }).send();
    }
    else {
        stop_badge_poll();
    }
};

/**
 * Messages Poller
 */
var ms_updater = function() {
    var last_updated_time = BG.last_msg_seen.get();

    if(BG.access_token.get() && BG.user.get()) { 
        // new messages check
        var r = new Request.JSONP({
            url: 'https://api.facebook.com/method/fql.query',
            data: {
                query: 'SELECT thread_id, updated_time FROM thread WHERE unread > 0 AND folder_id = 0 AND viewer_id = ' + BG.user.get().id,
                access_token: BG.access_token.get(),
                format: 'json'
            },
            onComplete: function(result) {
                if(result.length > 0) {
                    var count = 0;
                    var unread_ids = [];
                    
                    // cycle through ids to tally the ones with updated_time > last_updated_time
                    for(var m = 0; m < result.length; m++) {
                        if(result[m].updated_time > last_updated_time) {
                            count += 1;
                        }
                        
                        unread_ids.unshift(result[m].thread_id);
                    }
                    
                    BG.last_msg_seen.set(Util.get_current_epoch_time());
                    BG.unread_messages.set(BG.unread_messages.get()*1 + count);
                    BG.unread_msg_display.set(result.length);
                    BG.unread_msg_ids.set(unread_ids);
                }
                
                refresh_badge_count();
                // tell popup to update tab badges
                pokki.rpc('update_badges();');
            }
        }).send();
    
        // update messages cache
        var r = new Request.JSONP({
            url: 'https://graph.facebook.com/me/inbox',
            data: {
                include_read: true,
                access_token: BG.access_token.get(),
                format: 'json'
            },
            onComplete: function(resp) {
                if(! resp.error && ! resp.error_code) {
                    // check for changes
                    if(Util.message_results_differ(resp.data, BG.messages_cache.get())) {
                        BG.messages_cache.set(resp.data);
                        // update popup in background
                        pokki.rpc('update_messages();');
                    }
                }
            }
        }).send();
    }
    else {
        stop_badge_poll();
    }
};

/**
 * Friend Requests Poller
 */
var fr_updater = function() {
    if(BG.access_token.get() && BG.user.get()) {
        // update messages cache
        var r = new Request.JSONP({
            url: 'https://api.facebook.com/method/fql.query',
            data: {
                query: 'SELECT uid, name FROM user WHERE uid IN (SELECT uid_from FROM friend_request WHERE uid_to=' + BG.user.get().id + ')',
                access_token: BG.access_token.get(),
                format: 'json'
            },
            onComplete: function(result) {
                var prev_fr = JSON.encode(BG.friend_req_cache.get());
                var new_fr = JSON.encode(result);
                
                if(prev_fr != new_fr) {
                    // update cache
                    BG.friend_req_cache.set(result);
                    // sort seen/unseen
                    var seen = BG.friend_req_seen.get();
                    if(result.length > 0) {
                        // check for new friend requests
                        if(seen && seen.length > 0) {
                            for(var j = 0; j < result.length; j++) {
                                if(seen.contains(result[j].uid)) {
                                    result.erase(result[j]);
                                }
                                else {
                                    seen.unshift(result[j].uid);
                                }
                            }
                        }
                        // no previously seen, all are new
                        else {
                            seen = [];
                            // store ids for seen
                            for(var j = 0; j < result.length; j++) {
                                seen.unshift(result[j].uid);
                            }
                        }
                        BG.unread_friend_req.set(BG.unread_friend_req.get()*1 + result.length);
                    }
                    else {
                        // no friend requests, start from scratch
                        seen = [];
                        BG.unread_friend_req.set(0);
                    }
                    
                    BG.friend_req_seen.set(seen);
                    // update popup in background
                    pokki.rpc('update_friend_requests();');
                    
                    refresh_badge_count();
                    // tell popup to update tab badges
                    pokki.rpc('update_badges();');
                }
            }
        }).send();
    }
    else {
        stop_badge_poll();
    }
};

/**
 * Refresh badge counts
 * Used by both background.js and the popup via pokki.rpc
 */
var refresh_badge_count = function() {
    if(DEBUG) console.log('refresh badge count');
    var count = BG.unread_friend_req.get()*1 +
                BG.unread_messages.get()*1 +
                BG.unread_notifications.get()*1;
                
    if(count > numMax)
        count = numMax;
    
    if(count > 0)
        pokki.setIconBadge(count);
    else
        pokki.removeIconBadge();
    return count;
};

/**
 * Facebook Permissions poller
 * Checks once a day / relaunch to see if user has revoked access to anything and prompts if they have
 */
var permissions_fetch = function() {
    if(BG.access_token.get()) {
        var r = new Request.JSONP({
            url: 'https://api.facebook.com/method/fql.query',
            data: {
                query: 'SELECT offline_access,read_stream,publish_stream,read_mailbox,read_requests,email,user_activities,friends_activities FROM permissions WHERE uid=me()',
                access_token: BG.access_token.get(),
                format: 'json'
            },
            onComplete: function(resp) {
                if(! resp.error_code && resp.length > 0) {
                    
                    var permissions = resp[0];
                    permissions.timeout = 1000 * 60 * 60 * 24;
                    
                    // required permissions, offline_access will force the user to log in each time so no need to prompt a permissions screen for this
                    if( !permissions.read_stream || !permissions.friends_activities
                        || !permissions.publish_stream || !permissions.read_mailbox
                        || !permissions.read_requests || !permissions.user_activities) {
                        
                        // set flag to false
                        permissions.flag = false;
                        permissions.shown = false;
                        BG.permissions.set(permissions);
                    }
                    else {
                        permissions.flag = true;
                        BG.permissions.set(permissions);
                    }
                }
            }
        }).send();
    }
    else {
        stop_permissions_poll();
    }
};

/**
 * Starts polling, also a pokki.rpc method for popup to start the process after user logs in
 */
var start_badge_poll = function() {
    if(DEBUG) console.log('start badge poll');
    
    // first run call
    nf_updater();
    no_updater();
    ms_updater();
    fr_updater();
    
    // start polling
    nf_timer = nf_updater.periodical(2 * 60 * 1000); // 2 minutes
    no_timer = no_updater.periodical(1 * 60 * 1000); // 1 minute
    ms_timer = ms_updater.periodical(5 * 60 * 1000); // 5 minutes
    fr_timer = fr_updater.periodical(7 * 60 * 1000); // 7 minutes
};

/**
 * Starts permissions polling, also a pokki.rpc method for popup to start the process after user logs in
 */
var start_permissions_poll = function() {
    if(DEBUG) console.log('start permissions poll');
    
    var permissions = BG.permissions.get();
    if(permissions && permissions.timeout) {
        // poll for permissions based on set timeout
        permissions_timer = permissions_fetch.periodical(permissions.timeout);
    }
    else {
        // first run call
        permissions_fetch();
        // poll for permissions
        permissions_timer = permissions_fetch.periodical(1000 * 60 * 60 * 24); // once a day
    }
};

/**
 * Stop badge polling
 */
var stop_badge_poll = function() {
    if(DEBUG) console.log('stop badge poll');
    clearInterval(nf_timer);
    clearInterval(no_timer);
    clearInterval(ms_timer);
    clearInterval(fr_timer);
};

/**
 * Stop permissions polling, also a pokki.rpc method for popup
 */
var stop_permissions_poll = function() {
    if(DEBUG) console.log('stop permissions poll');
    clearInterval(permissions_timer);
}

/**
 * Initialization
 */
window.addEventListener('load', function() {
    start_badge_poll();
    start_permissions_poll();
    
    if(BG.access_token.get() && BG.user.get()) {
        // If user is logged in, add Log Out context menu item
        Util.add_logout_context();
    }
    
    // Add context menu listener
	pokki.addEventListener('context_menu', function(tag) { 
		if (tag == 'logout') {
            if(DEBUG) console.log('logout bg');
            
			stop_badge_poll();
            stop_permissions_poll();
            Util.background_logout();
		}
	});
}, false);