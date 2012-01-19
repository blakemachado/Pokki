/**
 * Facebook Pokki / baseController.js
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * Note: needs to be updated to use LocalStore class for consistency
 *
 * @version     2.1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * 				Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */

var BaseController = new Class({
	Implements: Events,
	
	Binds: ['track_badge_count', 'onTrackBadgeCount'],
	
	initialize: function() {
	
	},
	
	get_access_token: function() {
		return pokki.descramble(window.localStorage.getItem(KEYS.FB_ACCESS_TOKEN));
	},
	
	set_access_token: function(token) {
		this.access_token = token;
		window.localStorage.setItem(KEYS.FB_ACCESS_TOKEN, pokki.scramble(token));
	},
	
	get_user: function() {
		var user = JSON.decode(pokki.descramble(window.localStorage.getItem(KEYS.FB_USER)));
		// If user object exists, return it, otherwise logout and prompt the user to login to obtain the user object again
		if (user)
			return user;
		else
			Util.background_logout();
	},
	
	set_user: function(data) {
		window.localStorage.setItem(KEYS.FB_USER, pokki.scramble(JSON.encode(data)));
	},
	
	get_user_picture: function() {
		var user = this.get_user();
		return (user && user.id) ? 'http://graph.facebook.com/' + user.id + '/picture':'img/avatar.png';
	},
	
	make_graph_call: function(url, data, callback) {
		if (DEBUG) console.log('[GRAPH CALL]', url, data);
		var r = new Request.JSONP({
			url: url,
			data: data,
			onComplete: callback,
			onFailure: function(xhr) {
				console.log('Ajax fail');
			},
			onTimeout: function() {
				console.log('Timeout');
			},
			onException: function(headerName, value) {
				console.log('Exception');
			},
			onError: function() {
				console.log('error');
			}
		}).send();
		return r;
	},
	
	post_graph_call: function(url, callback) {
		if (DEBUG) console.log('[POST CALL]', url);
		var r = new Request({
			url: url,
			data: {
				access_token: pokki.descramble(window.localStorage.getItem(KEYS.FB_ACCESS_TOKEN))
			},
			method: 'post',
			onFailure: function(xhr) {
				console.log('Ajax fail');
				// permissions error
				PERM_Controller = new PermissionsController($(CONTENT.WRAPPER));
			},
			onTimeout: function() {
				console.log('Timeout');
			},
			onException: function(headerName, value) {
				console.log('Exception');
			},
			onError: function() {
				console.log('error');
			},
			onComplete: callback
		}).send();
		return r;
	},
	
	update_cache: function(key, data) {
		try {
			window.localStorage.setItem(key, data);
		}
		catch(e) {
			console.log(e);			
			try {
				window.localStorage.removeItem(key);
				window.localStorage.setItem(key, data);
			}
			catch(e) {
				console.log(e);
			}
		}
	},
	
	track_badge_count: function() {
		/*
		var badgecount = pokki.rpc('refresh_badge_count()');
		badgecount = badgecount ? badgecount : 0;
		GA.trackEvent();
		*/
	},
	
	onTrackBadgeCount: function() {
		this.track_badge_count();
	}
});