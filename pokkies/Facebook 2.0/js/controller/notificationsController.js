/**
 * Facebook Pokki / notificationsController.js - Controls the Notifications Tab
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
var NotificationsController = new Class({
	Extends: BaseTabController,
	
    /**
     * Initialization (see BaseTabController class)
     */
	initialize: function(tab, content, tabs_selector, unread_key, show) {
		this.parent(tab, content, tabs_selector, unread_key, show);
		
		this.unread_ids = [];
	},
	
	onHide: function() {
		this.parent();
		this.mark_unread_ids();
		this.content.getElements('.ntList .unread').removeClass('unread');
	},
	
	onPopupHidden: function() {
		this.parent();
		this.mark_unread_ids();
		this.clear_badge();
		this.content.getElements('.ntList .unread').removeClass('unread');
	},
	
	fetch_cache: function(no_transition) {
		if (DEBUG) console.log('[NOTIFICATIONS]', 'Fetching Cache');
		var data = window.localStorage.getItem(KEYS.NOTIFICATIONS_CACHE);
		if (data) {
			data = JSON.decode(data);
			var view = new NotificationsView(data, this, no_transition);
			
			return true;
		}
		return false;
	},
	
	fetch_content: function() {
		if (DEBUG) console.log('[NOTIFICATIONS]', 'Fetching Content');
		this.make_graph_call(
			"https://graph.facebook.com/fql",
			{
				q: "SELECT notification_id, sender_id, updated_time, title_text, body_text, href, icon_url, is_unread FROM notification WHERE recipient_id=me() AND is_hidden = 0",
				access_token: this.get_access_token(),
				format: "json"
			},
			this.callback.bind(this)
		);
	},
	
	callback: function(resp) {
		this.spinner.hide();
		this.reenable_force_fresh.delay(3000, this);
		
		if (resp.error) {
			if (resp.error.message.contains('190')) {
				window.localStorage.removeItem(KEYS.FB_ACCESS_TOKEN);
				new LoginController();
			}
			else if (resp.error.message.contains('(#4)') || resp.error.message.contains('request limit reached')) {
				pokki.rpc('stop_badge_poll();');
				pokki.rpc('test_badge_poll();');
				console.log(resp.error.message);
			}
			else if (resp.error.message) {
				console.log(resp.error.message);
			}			
		}
		else if (resp.error_code) {
			if (resp.error_code == 190) {
				window.localStorage.removeItem(KEYS.FB_ACCESS_TOKEN);
				new LoginController();
			}
			else if (resp.error_code == 4 || resp.error_msg.contains('request limit reached')) {
				pokki.rpc('stop_badge_poll();');
				pokki.rpc('test_badge_poll();');
				console.log(resp.error_msg);
			}
			else if (resp.error_msg) {
				console.log(resp.error_msg);
			}
		}
		else if(this.results_differ(resp.data, window.localStorage.getItem(KEYS.NOTIFICATIONS_CACHE))) {
			// Create the view
			var view = new NotificationsView(resp.data, this);
			// Update cache
			this.update_cache(KEYS.NOTIFICATIONS_CACHE, resp.data);
		}
	},
	
	results_differ: function(new_results, old_results) {
		if (!this.get_results_div()) {
			// if first load and no results displayed, populate it
			return true;
		}
		
		if (!old_results)
			return true;
		
		if (old_results.length != new_results.length) {
			return true;
		} else {
			for(var i = 0; i < new_results.length; i++) {
				/*
				if(new_results[i].body_html != old_results[i].body_html) {
					return true;
				}
				else */
				if(new_results[i].created_time != old_results[i].created_time) {
					return true;
				}
				else if(new_results[i].id != old_results[i].id) {
					return true;
				}
			}
		}
		
		return false;
	},
	
	/**
	 * Add a notification id to the unread list
	 */
	add_unread_id: function(id) {
		this.unread_ids.unshift(id);
	},
	
	/**
	 * Tell Facebook that these IDs have been read
	 */
	mark_unread_ids: function() {
		if (DEBUG) console.log('[NOTIFICATIONS] Unreads', this.unread_ids);
		if(this.unread_ids.length > 0) {
			for (var i = 0; i < this.unread_ids.length; i++) {
				var unread_id = this.unread_ids[i];
				if (DEBUG) console.log('[NOTIFICATIONS] Mark Unread Graph Call', unread_id);
				// The FQL doesn't return the unique notification ID, so we need to construct it: "notif_userid_notifid"
				var url = 'https://graph.facebook.com/notif_'+this.get_user().id+'_'+unread_id+'?unread=0';
				
				this.post_graph_call(url, function() {
					this.unread_ids.erase(unread_id);
				}.bind(this));				
			}
		}
	},
});