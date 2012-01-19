/**
 * Facebook Pokki / messagesController.js - Controls the Messages Tab
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
var MessagesController = new Class({
    Extends: BaseTabController,

    /**
     * Initialization (see BaseTabController class)
     */
    initialize: function(tab, content, tabs_selector, unread_key, show) {
        this.parent(tab, content, tabs_selector, unread_key, show);
    },
	
	/**
	 * Populates from cache
	 * @param Boolean   no_transition     Whether to skip the transition or not
	 */   
    fetch_cache: function(no_transition) {
    	if (DEBUG) console.log('[MESSAGES]', 'Fetching Cache');
        var data = JSON.decode(window.localStorage.getItem(KEYS.MESSAGES_CACHE));
        if(data && (typeof(data) == 'object' || typeof(data) == 'array')) {
            var view = new MessagesView(data, this, no_transition);
            return true;
        }
        return false;
    },

	/**
	 * Populates from Ajax call
	 * Facebook Messages API is sort of wonky right now. If you're on the new system you may have missing messages and vice versa
	 * Also the URLs to access individual messages is broken if you're on the new system
	 */
    fetch_content: function() {
    	if (DEBUG) console.log('[MESSAGES]', 'Fetching Content');
        //var messageurl = "https://graph.facebook.com/me/threads?access_token=" + this.get_access_token();
        
        /*
        var queries = {
            "threads" : "SELECT thread_id, subject, updated_time, parent_message_id, parent_thread_id, message_count, snippet, snippet_author, object_id, unread FROM thread WHERE folder_id = 0 AND snippet_author != me() limit 25",
            "user_data" : "SELECT id, name, url, pic_square FROM profile WHERE id IN ( SELECT snippet_author FROM #threads)"
        };
        queries = JSON.encode(queries);
        var messageurl = "https://api.facebook.com/method/fql.multiquery?access_token=" + this.get_access_token() + '&queries=' + encodeURIComponent(queries) + '&format=json';
        */
        this.make_graph_call(
        	"https://graph.facebook.com/me/inbox",
        	{ access_token: this.get_access_token() },
        	this.callback.bind(this)
        );
    },
    
	/**
	 * Callback for fetch_content
	 */   
    callback: function(resp) {
        this.spinner.hide();
        this.reenable_force_fresh.delay(3000, this);
        if (resp.error || resp.error_code) {
            // why are they so inconsistent?
            if(resp.error.message.contains('Invalid OAuth') || resp.error_code == 190) {
                window.localStorage.removeItem(KEYS.FB_ACCESS_TOKEN);
                new LoginController();
            }
            else if(resp.error.message.contains('read_mailbox') || resp.error_code == 612) {
                // permissions error
                PERM_Controller = new PermissionsController($(CONTENT.WRAPPER));
            }
            else if (resp.error.message.contains('(#4)') || resp.error.message.contains('request limit reached')) {
            	pokki.rpc('stop_badge_poll();');
            	pokki.rpc('test_badge_poll();');
                console.log(resp.error.message);
            }
            else {
                console.log(resp.error ? resp.error.message : '', resp.error_code ? resp.error_code : '');
            }
        }
        // Update the view if content is new
        else if(this.results_differ(resp.data, JSON.decode(window.localStorage.getItem(KEYS.MESSAGES_CACHE)))) {        
            // Create the view
            var view = new MessagesView(resp.data, this);
            // Update last seen
            var threads = resp.data;
            // Update cache
            this.update_cache(KEYS.MESSAGES_CACHE, JSON.encode(threads));
        }
    },
    
	/**
	 * Check for new results 
	 */
    results_differ: function(new_results, old_results) {
        if(!this.get_results_div()) {
            // if first load and no results displayed, populate it
            return true;
        }
        
        return Util.message_results_differ(new_results, old_results);
    }
    
    
});