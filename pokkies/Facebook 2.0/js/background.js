/**
 * Facebook Pokki / background.js - background javascript file
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     2.1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * 				Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */

var numMax = 99;	// Set the highest badge number

// LocalStore objects
var BG = {
	user:                   new LocalStore(KEYS.FB_USER, {scrambled: true}),
	access_token:           new LocalStore(KEYS.FB_ACCESS_TOKEN, {scrambled: true}),
	last_msg_seen:          new LocalStore(KEYS.LAST_MESSAGE_SEEN, {defaultVal: 0}),
	newsfeed_cache:         new LocalStore(KEYS.NEWS_FEED_CACHE),
	friend_req_cache:       new LocalStore(KEYS.FRIEND_REQUESTS_CACHE, {defaultVal: []}),
	notifications_cache:    new LocalStore(KEYS.NOTIFICATIONS_CACHE),
	messages_cache:         new LocalStore(KEYS.MESSAGES_CACHE),
	events_cache:        	new LocalStore(KEYS.EVENTS_CACHE),
	friend_req_seen:        new LocalStore(KEYS.FRIEND_REQUESTS_SEEN),
	unread_messages:        new LocalStore(KEYS.UNREAD_MESSAGES, {defaultVal: 0}),
	unread_msg_display:     new LocalStore(KEYS.UNREAD_MSG_COUNT_DISPLAY, {defaultVal: 0}),
	unread_friend_req:      new LocalStore(KEYS.UNREAD_FRIEND_REQUESTS, {defaultVal: 0}),
	unread_msg_ids:         new LocalStore(KEYS.UNREAD_MESSAGE_IDS),
	unread_notifications:   new LocalStore(KEYS.UNREAD_NOTIFICATIONS, {defaultVal: 0}),
	permissions:            new LocalStore(KEYS.PERMISSIONS),
	friends_cache:			new LocalStore(KEYS.FRIENDS)
};

var permissions_timer = '';
var nf_timer = '';
var no_timer = '';
var ms_timer = '';
var ev_timer = '';
var fr_timer = '';
var pulls_paused = false;

// Newsfeed Poller
var nf_updater = function() {
	if(BG.access_token.get() && BG.user.get()) { 
		// update newsfeed cache
		var r = new Request.JSONP({
			url: 'https://graph.facebook.com/me/home',
			data: {
				access_token: BG.access_token.get()
			},
			onComplete: function(resp) {
				if (DEBUG) console.log('[GRAPH CALL] Newsfeed Updater', resp);
				if (resp.error || resp.error_code) {
					error_handling(resp);
				}
				else {
					BG.newsfeed_cache.set(resp);
					if (!pokki.isPopupShown()) {
						// update in background
						if (DEBUG) console.log('[BACKGROUND] Update news feed');
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

// Notifications Poller
var no_updater = function() {
	if(BG.access_token.get() && BG.user.get()) { 
		// update notifications cache
		var r = new Request.JSONP({
			url: 'https://graph.facebook.com/fql',
			data: {
				q: 'SELECT notification_id, sender_id, title_text, body_text, updated_time, href, icon_url, is_unread FROM notification WHERE recipient_id=me() AND is_hidden = 0',
				access_token: BG.access_token.get(),
				format: 'json'
			},
			onComplete: function(resp) {
				if (DEBUG) console.log('[GRAPH CALL] Notifications Updater', resp);
				
				if (resp.error || resp.error_code) {
					error_handling(resp);
				}
				else { 
					BG.notifications_cache.set(resp.data);
								
					if (DEBUG) console.log('[BACKGROUND] Update notifications');
					pokki.rpc('update_notifications();');
					
					// count the unread notifications
					// we don't have to worry about comparing notifications because clicking on the notifications tab pings facebook to tell them the unread notifications have been viewed
					var no = resp.data;
					var num_unread = 0;
					for (var i = 0; i < no.length; i++) {
						//if(no[i].is_unread) {
						if(no[i].is_unread == 1) {
							num_unread += 1;
						}
					}
					
					BG.unread_notifications.set(num_unread);
					
					refresh_badge_count();
					pokki.rpc('update_badges();');
				}
			}
		}).send();
	}
	else {
		stop_badge_poll();
	}
};


// Messages Poller
var ms_updater = function() {
	if(BG.access_token.get() && BG.user.get()) { 
		// update messages cache
		var r = new Request.JSONP({
			url: 'https://graph.facebook.com/me/inbox',
			data: {
				include_read: true,
				access_token: BG.access_token.get(),
				format: 'json'
			},
			onComplete: function(resp) {
				if (DEBUG) console.log('[GRAPH CALL] Messages Updater', resp);
				
				if (resp.error || resp.error_code) {
					error_handling(resp);
				}
				else if (resp.data) { 
					
					var threads = [];
					var count = 0;
					var unread_ids = [];
					var user_id = BG.user.get().id;
					var last_msg_seen = BG.last_msg_seen.get();
					
					for (var m = 0; m < resp.data.length; m++) {
					
						if (!resp.data[m].from) {
							if(DEBUG) console.log('This message has no from object', resp.data[m].id);
							continue;
						}
					
						var user_is_a_recipient = false;
						//if (DEBUG) console.log('[Recipients list]', threads[i].to.data);
						var recipients = resp.data[m].to.data;
						for (var to = 0; to < recipients.length; to++) {
							if (recipients[to] && recipients[to].id === user_id) {
								user_is_a_recipient = true;
								break;
							}
						}
						if (!user_is_a_recipient) {
							if(DEBUG) console.log('User is not a recipient of this thread', resp.data[m].id);
							continue;
						} 					
						
						threads.push(resp.data[m]);
						if (resp.data[m].unread != 0) {
						
							// Convert facebook updated_time to epoch time for comparison
							var last_updated_time = new Date(resp.data[m].updated_time).getTime()/1000.0;
							if (last_msg_seen < last_updated_time) {
								count += 1;
							}
							unread_ids.unshift(resp.data[m].id);
						}
					}
					
						
					if (DEBUG) console.log('Cleaned Threads', threads);
					// check for changes
					if (Util.message_results_differ(threads, BG.messages_cache.get())) {						

						BG.messages_cache.set(threads);

						//BG.last_msg_seen.set(Util.get_current_epoch_time());
						BG.unread_messages.set(BG.unread_messages.get()*1 + count);
						BG.unread_msg_display.set(count);
						BG.unread_msg_ids.set(unread_ids);

						
						if (DEBUG) console.log('[BACKGROUND] Update messages');
						pokki.rpc('update_messages();');
						
						refresh_badge_count();
						pokki.rpc('update_badges();');
					}
				}
			}
		}).send();
	}
	else {
		stop_badge_poll();
	}
};


// Events Puller
var ev_updater = function() {
	if (BG.access_token.get() && BG.user.get()) { 
		// update events cache
		var r = new Request.JSONP({
			url: "https://graph.facebook.com/fql",
			data: {
				q: "{'eventslist':'SELECT eid, rsvp_status FROM event_member WHERE uid = me() AND start_time > " + Math.round(new Date().getTime() / 1000) + " ORDER BY start_time','eventsdetails':'SELECT eid, name, tagline, description, location, venue, creator, host, privacy, event_type, event_subtype, pic_big, pic_square, start_time, end_time FROM event WHERE eid IN (SELECT eid FROM #eventslist) ORDER BY start_time'}",
				access_token: BG.access_token.get(),
				format: 'json'
			},
			onComplete: function(resp) {
				if (DEBUG) console.log('[GRAPH CALL] Events Updater', resp);
				
				if (resp.error || resp.error_code) {
					error_handling(resp);
				}
				else if (resp.data) { 
		
					BG.events_cache.set(resp.data);
						
					if (DEBUG) console.log('[BACKGROUND] Update events');
					pokki.rpc('update_events();');
						
					refresh_badge_count();
					pokki.rpc('update_badges();');
				}
			}
		}).send();
	}
	else {
		stop_badge_poll();
	}
};

// Friend Requests Poller
var fr_updater = function() {
	if(BG.access_token.get() && BG.user.get()) {
		// update friend requests cache
		
		
		var r = new Request.JSONP({
			url: 'https://graph.facebook.com/fql',
			data: {
				q: 'SELECT uid, name FROM user WHERE uid IN (SELECT uid_from FROM friend_request WHERE uid_to=me())',
				access_token: BG.access_token.get(),
				format: 'json'
			},
			onComplete: function(resp) {
			
				if (DEBUG) console.log('[GRAPH CALL] Friend Requests Updater', resp);
			
				if (resp.error || resp.error_code) {
					error_handling(resp);
				}
				else if (resp.data) { 
					
					var friend_reqs = resp.data;
					var prev_fr = JSON.encode(BG.friend_req_cache.get());
					var new_fr = JSON.encode(friend_reqs);
					
					if (prev_fr != new_fr) {
						// update cache
						BG.friend_req_cache.set(friend_reqs);
						// sort seen/unseen
						var friend_reqs_array = [];
						var seen = BG.friend_req_seen.get();
						var unseen_count = 0;
						var canceled_count = 0;
						
						if (friend_reqs.length > 0) {
							// check for new friend requests
							if (seen && seen.length > 0) {
								for (var j = 0; j < friend_reqs.length; j++) {
									friend_reqs_array.include(friend_reqs[j].uid);
									if (!seen.contains(friend_reqs[j].uid)) {
										unseen_count += 1;
										seen.unshift(friend_reqs[j].uid);
									}
								}
								for (var s = 0; s < seen.length; s++) {
									// If there are user in the seen list but not in the new friend request, it means someone cancelled
									if (!friend_reqs_array.contains(seen[s])) {
										canceled_count += 1;
										seen.erase(seen[s]);
									}
								}
							}
							// no previously seen, all are new
							else {
								seen = [];
								// store ids for seen
								for (var j = 0; j < friend_reqs.length; j++) {
									seen.unshift(friend_reqs[j].uid);
								}
								unseen_count = friend_reqs.length;
							}
							if (DEBUG) console.log('[Friend Requests] '+canceled_count+' Canceled / '+unseen_count+' New');
							BG.unread_friend_req.set(BG.unread_friend_req.get()*1 - canceled_count + unseen_count);
						}
						else {
							// no friend requests, start from scratch
							seen = [];
							BG.unread_friend_req.set(0);
						}
						
						BG.friend_req_seen.set(seen);
						if (DEBUG) console.log('[BACKGROUND] Update friend requests');
						pokki.rpc('update_friend_requests();');
						
						refresh_badge_count();
						pokki.rpc('update_badges();');
					}
				}
			}
		}).send();
	}
	else {
		stop_badge_poll();
	}
};


// pokki.rpc method for the popup to refresh badge counts
var refresh_badge_count = function() {
	if(DEBUG) console.log('refresh badge count');
	var count = BG.unread_friend_req.get()*1 +
				BG.unread_messages.get()*1 +
				BG.unread_notifications.get()*1;
				
	if(count > numMax)
		count = numMax;
	
	if(count > 0) {
		pokki.setIconBadge(count);
	} else
		pokki.removeIconBadge();
	return count;
};

var permissions_fetch = function() {
	if(BG.access_token.get()) {
	
		
		var r = new Request.JSONP({
			url: 'https://graph.facebook.com/fql',
			data: {
				q: 'SELECT offline_access,read_stream,publish_stream,read_mailbox,read_requests,email,user_activities,user_events,rsvp_event,friends_activities,manage_notifications,manage_friendlists FROM permissions WHERE uid=me()',
				access_token: BG.access_token.get(),
				format: 'json'
			},
			onComplete: function(resp) {
			
				if (DEBUG) console.log('[GRAPH CALL] Permissions Fetch', resp);
				
				if (!resp.error && !resp.error_code && resp.length > 0) {
					
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

var error_handling = function(resp) {
	if (resp.error) {
		// If error is #4 Applicaton request limit reached
		if (resp.error.message && (resp.error.message.contains('(#4)') || resp.error.message.contains('request limit reached'))) {
			stop_badge_poll();
			test_badge_poll();
		}
		console.log(resp.error.message);
	}
	// Legacy error format
	else if (resp.error_code) {
		// If error is #4 Applicaton request limit reached
		if (resp.error_code == 4 || resp.error_msg.contains('request limit reached')) {
			stop_badge_poll();
			test_badge_poll();
		}
		console.log(resp.error_msg);	
	}
};

// also pokki.rpc method for the popup to restart badge polls and get permissions granted
var start_badge_poll = function() {
	if(DEBUG) console.log('start badge poll');
	// first run call
	nf_updater();
	no_updater();
	ms_updater();
	ev_updater();
	fr_updater();
	// start polling
	nf_timer = nf_updater.periodical(3 * 60 * 1000); // 3 minutes
	no_timer = no_updater.periodical(2 * 60 * 1000); // 2 minute
	ms_timer = ms_updater.periodical(5 * 60 * 1000); // 5 minutes
	ev_timer = ev_updater.periodical(10 * 60 * 1000); // 10 minutes
	fr_timer = fr_updater.periodical(20 * 60 * 1000); // 20 minutes
};
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

var stop_badge_poll = function() {
	if(DEBUG) console.log('stop badge poll');
	clearInterval(nf_timer);
	clearInterval(no_timer);
	clearInterval(ms_timer);
	clearInterval(ev_timer);
	clearInterval(fr_timer);
};
var stop_permissions_poll = function() {
	if(DEBUG) console.log('stop permissions poll');
	clearInterval(permissions_timer);
};


// Recursive pulling to see whether API request limit has been reached
var test_badge_poll = function() {
	if (pulls_paused) return false;
	if(DEBUG) console.log('test poll');		
	pulls_paused = true;
	var r = new Request.JSONP({
		url: 'https://graph.facebook.com/me',
		data: {
			access_token: BG.access_token.get(),
			format: 'json'
		},
		onComplete: function(resp) {			
			if (!resp.error) {
				start_badge_poll();
			}
			else {
				stop_badge_poll();
				test_badge_poll.delay(60 * 60 * 1000) // test poll again in 60 mins
			}
		}
	}).send();
};

window.addEventListener('load', function() {
	start_badge_poll();
	start_permissions_poll();    
	
	if(BG.access_token.get() && BG.user.get()) {
		Util.add_logout_context();
	}
	

	// Add event handling for context menu for background related functionalities
	pokki.addEventListener('context_menu', function(tag) { 
		if (tag == 'logout') {
			if(DEBUG) console.log('logout bg');			
			stop_badge_poll();
			stop_permissions_poll();
			Util.background_logout();
		}
	});
}, false);
