/**
 * Facebook Pokki / eventsController.js - Controls the Events Tab
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * Note: needs to be updated to use LocalStore class for consistency
 *
 * @version     2.1.0
 * @license     MIT License
 * @author      Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */

var EventsController = new Class({
	Extends: BaseTabController,
	
	/**
	  * Initialization (see BaseTabController class)
	  */
	initialize: function(tab, content, tabs_selector, unread_key, show) {
		this.parent(tab, content, tabs_selector, unread_key, show);		
		
		// Setup status mapping for display
		this.display_status = new Array();
		this.display_status['attending'] 	= 'Going';
		this.display_status['unsure'] 		= 'Maybe';
		this.display_status['declined'] 	= 'Declined';
		this.display_status['not_replied']	= '';		
		this.rsvp_display = new Array();
		this.rsvp_display['not_replied'] = 'Respond to Invite';
		this.rsvp_display['attending'] = 'You are going';
		this.rsvp_display['unsure'] = 'You might go';
		this.rsvp_display['declined'] = 'You are not going';
		this.rsvp_call = new Array();
		this.rsvp_call['not_replied'] = 'noreply';
		this.rsvp_call['attending'] = 'attending';
		this.rsvp_call['unsure'] = 'maybe';
		this.rsvp_call['declined'] = 'declined';
		
		this.view;		
		this.unread_ids = [];
	},
	
	onHide: function() {
		this.parent();
		this.content.getElements('.evList .unread').removeClass('unread');
	},
	
	onPopupHidden: function() {
		this.parent();
		this.clear_badge();
		this.content.getElements('.evList .unread').removeClass('unread');
	},
	
	fetch_cache: function(no_transition) {
		if (DEBUG) console.log('[EVENTS]', 'Fetching Cache');
		var data = window.localStorage.getItem(KEYS.EVENTS_CACHE);
		if (data) {
			data = JSON.decode(data);
			this.view = new EventsView(data, this, no_transition);			
			return true;
		}
		return false;
	},
	
	fetch_content: function() {
		if (DEBUG) console.log('[EVENTS]', 'Fetching Content');
		// FQL Multiqueries in one call to get both the list of events as well as event details
		this.make_graph_call(
			"https://graph.facebook.com/fql",
			{
				q: "{'eventslist':'SELECT eid, rsvp_status FROM event_member WHERE uid = me() AND start_time > " + Math.round(new Date().getTime() / 1000) + " ORDER BY start_time','eventsdetails':'SELECT eid, name, tagline, description, location, venue, creator, host, privacy, event_type, event_subtype, pic_big, pic_square, start_time, end_time FROM event WHERE eid IN (SELECT eid FROM #eventslist) ORDER BY start_time'}",
				access_token: this.get_access_token(),
				format: 'json'			
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
		else if (this.results_differ(resp.data, window.localStorage.getItem(KEYS.EVENTS_CACHE))) {
			// Create the view
			this.view = new EventsView(resp.data, this);
			// Update cache
			this.update_cache(KEYS.EVENTS_CACHE, resp.data);
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
		}
		if (old_results[0].fql_result_set.length != new_results[0].fql_result_set.length) {
			return true;
		}
		for (var i = 0; i < new_results[0].fql_result_set.length; i++) {
			if (new_results[0].fql_result_set[i].eid != old_results[0].fql_result_set[i].eid) {
				return true;
			}
		}
		return false;
	}
});