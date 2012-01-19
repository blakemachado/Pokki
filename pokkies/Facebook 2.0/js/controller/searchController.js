/**
 * Facebook Pokki / searchController.js - Controls Search functionalities
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

var SearchController = new Class({
	Extends: BaseController,
	
	initialize: function() {

		this.search = $('search');
		this.search_field = $(TABS.SEARCH_FIELD);
		this.query = '';
		
		this.query_types = ['user', 'page', 'place', 'group'];
		this.query_i = 0;
		
		this.view = null;
		
		this.cancel_search = false;
	
		// Add interaction handling for the search box
		this.search_field.addEvent('keyup', (function(e) {
			e.preventDefault();
			if (e.key === 'enter') {
				this.query = this.search_field.get('value');
				if (this.query === '') return false;
				this.start_spinner();
				this.prepare_content();
			}
		}).bind(this)).addEvent('focus', (function(e) {
			this.cancel_search = false;
     		$(CONTENT.WRAPPER).removeClass('sub');
   			$$(CONTENT.SHOW_SUBCONTENT_ITEMS).removeClass('selected');
     		this.search.removeClass('active').addClass('focus');
     		if ($(CONTENT.SEARCH_RESULTS) && this.search_field.get('value') === this.query) {
     			this.search_field.set('value', '');
     		}
		}).bind(this)).addEvent('blur', (function(e) {
			this.search.removeClass('focus');
			if (!this.view) return false;
			if ((this.search_field.get('value') === '' || this.search_field.get('value') === this.view.query) && $(CONTENT.SEARCH_RESULTS) && this.view.query === this.query) {
				this.search_field.set('value', this.view.query);
				this.search.addClass('active');
			}
		}).bind(this));	
	},
	
	/**
	 * Resets the search field to the default stage 
	 **/
	reset_field: function() {
		this.cancel_search = true;
		this.query = '';
		this.view = null;
		this.search.removeClass('focus').removeClass('active');
		this.search_field.set('value', '');
		this.stop_spinner();
	},
	
	/**
	 * Starts the loading indicator 
	 **/
	start_spinner: function() {
		if (DEBUG) console.log('Query:', this.query);
		this.search.addClass('loading');
		this.search_field.setProperty('disabled', 'disabled');
	},
	
	/**
	 * Stops the loading indicator 
	 **/
	stop_spinner: function() {
		this.search.removeClass('loading').addClass('active');
		this.search_field.removeProperty('disabled').blur();
	},
		
	prepare_content: function() {
		this.query_i = 0;

		// Get friends list
		var friends_cache = window.localStorage.getItem(KEYS.FRIENDS);
		if (friends_cache) {
			this.query_friends(JSON.decode(friends_cache));
		} else {
			this.make_graph_call(
				"https://graph.facebook.com/me/friends",
				{ access_token: this.get_access_token() },
				this.get_friends_callback.bind(this)
			);
		}
	},
	
	get_friends_callback: function(resp) {
		if(resp.error || resp.error_code) {
			this.error_handling(resp);
		} else {
			var all_friends = resp.data;
			this.query_friends(all_friends);
			// Update cache
			this.update_cache(KEYS.FRIENDS, JSON.encode(all_friends));
		}
	},
	get_results_callback: function(resp) {
		if (resp.error || resp.error_code) {
			this.error_handling(resp);
		} else {
			this.show_results(this.query_types[this.query_i], resp.data);
		}
		this.query_i++;
	   	this.query_next();
	},

	/**
	 * Query Friends from cache
	 **/
	query_friends: function(all_friends) {
		var matched_friends = all_friends.filter(function(friend, index) {
			var name = friend.name.toLowerCase();
			return (name.contains(this.query.toLowerCase()));
		}, this);
		if (DEBUG) console.log('[MATCHED FRIENDS]', matched_friends);
		if (matched_friends.length > 0) {
			this.show_results('friends', matched_friends);
		}   	
	   	// Trigger the querying for the rest of the results
	   	this.query_next();
	},

	/**
	 * Query various search result type 
	 **/
	query_next: function() {
		// Go through each result type and query them
		if (this.query_i >= this.query_types.length) {
			this.stop_spinner();
			this.view.load_no_results();
			return false;
		}
		var queryUrl = 'https://graph.facebook.com/search?access_token='+this.get_access_token()+'&type='+this.query_types[this.query_i]+'&q='+this.query;
		switch(this.query_types[this.query_i]) {
			case 'place':
				queryUrl += '&center='+geoplugin_latitude()+','+geoplugin_longitude();
				break;
	    	default:
		}
		this.make_graph_call(queryUrl, {}, this.get_results_callback.bind(this));
	},
	
	show_results: function(type, data) {
		if (this.cancel_search) return false;		
		if (!this.view) {
			this.view = new SearchView(this);
		} else if (this.view.query != this.query || !this.is_showing()) {
			this.view = new SearchView(this);
			//this.view.transition_content();
		}
		this.view.add_results(type, data);
	},
	
	error_handling: function(resp) {
	
		this.reset_field();
		if (resp.error) {
			if (resp.error.message.contains('Invalid OAuth')) {
				window.localStorage.removeItem(KEYS.FB_ACCESS_TOKEN);
				new LoginController();
			}
			else if (resp.error.message.contains('access token')) {
				// permissions error
				PERM_Controller = new PermissionsController($(CONTENT.WRAPPER));
			}
			else if (resp.error.message.contains('(#4)') || resp.error.message.contains('request limit reached')) {
				pokki.rpc('stop_badge_poll();');
				pokki.rpc('test_badge_poll();');
				console.log(resp.error.message);
			}
			else {
				console.log(resp.error.message);
			}
		}
		else if (resp.error_code) {
			if (resp.error_code == 190) {
				window.localStorage.removeItem(KEYS.FB_ACCESS_TOKEN);
				new LoginController();
			}
			else if (resp.error_code == 612) {
				// permissions error
				PERM_Controller = new PermissionsController($(CONTENT.WRAPPER));
			}
			else if (resp.error_code == 4 || resp.error_msg.contains('request limit reached')) {
				pokki.rpc('stop_badge_poll();');
				pokki.rpc('test_badge_poll();');
				console.log(resp.error_msg);
			}
			else {
				console.log(resp.error_msg);
			}
		}
	},
	
	results_differ: function(new_results, old_results) {
		if(!this.get_results_div()) {
			// if first load and no results displayed, populate it
			return true;
		}
		
		return Util.message_results_differ(new_results, old_results);
	},
	
	is_showing: function() {
		return !this.view.main.hasClass('switch');  
	}
	
	
});