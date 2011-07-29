/**
 * Facebook Pokki / friendRequestsController.js - Controls the Friend Requests Tab
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * Note: needs to be updated to use LocalStore class for consistency
 *
 * @version     1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */
 
var FriendRequestsController = new Class({
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
        var data = window.localStorage.getItem(KEYS.FRIEND_REQUESTS_CACHE);
        if(data) {
            data = JSON.decode(data);
            var view = new FriendRequestsView(data, this, no_transition);
            
            return true;
        }
        return false;
    },
    
    /**
     * Populates from Ajax call
     */
    fetch_content: function() {
        var user = this.get_user();
        var fql = 'SELECT uid, name FROM user WHERE uid IN (SELECT uid_from FROM friend_request WHERE uid_to=' + user.id + ')';
        
        var friendrequesturl = "https://api.facebook.com/method/fql.query?query=" + encodeURIComponent(fql) + "&access_token=" + this.get_access_token() + "&format=json";
        this.make_graph_call(friendrequesturl, this.callback.bind(this));
    },
    
    /**
     * Callback for fetch_content
     */
    callback: function(resp) {
        this.spinner.hide();
        this.reenable_force_fresh.delay(3000, this);
        
        if(resp.error_code) {
            if(resp.error_code == 190) {
                // User auth error, prompt to re-login
                window.localStorage.removeItem(KEYS.FB_ACCESS_TOKEN);
                new LoginController();
            }
            else {
                console.log(resp.error_msg);
            }
        }
        // Update view if there's new content
        else if(this.results_differ(resp, JSON.decode(window.localStorage.getItem(KEYS.FRIEND_REQUESTS_CACHE)))) {
            // Create the view
            var view = new FriendRequestsView(resp, this);
            // Update cache
            this.update_cache(KEYS.FRIEND_REQUESTS_CACHE, JSON.encode(resp));
        }
    },
    
    /**
     * Compares friend request results
     */
    results_differ: function(new_results, old_results) {
        if(!this.get_results_div()) {
            // if first load and no results displayed, populate it
            return true;
        }
        
        if(!old_results)
            return true;
        
        if(old_results.length != new_results.length) {
            return true;
        }
        else {
            for(var i = 0; i < new_results.length; i++) {
                if(new_results[i].uid != old_results[i].uid) {
                    return true;
                }
            }
        }
        
        return false;
    }
});