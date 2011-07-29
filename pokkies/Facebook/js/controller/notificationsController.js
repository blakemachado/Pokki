/**
 * Facebook Pokki / notificationsController.js - Controls the Notifications Tab
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
 
var NotificationsController = new Class({
    Extends: BaseTabController,
    
    /**
     * Initialization (see BaseTabController class)
     */
    initialize: function(tab, content, tabs_selector, unread_key, show) {
        this.parent(tab, content, tabs_selector, unread_key, show);
        
        // keep track of which ones are unread so we can ping facebook to say they've been seen
        this.unread_ids = [];
    },
    
    /**
     * Tab onHide event
     */
    onHide: function() {
        this.parent();
        this.mark_unread_ids();
    },
    
    /**
     * Fired when popup is hidden
     */
    onPopupHidden: function() {
        this.parent();
        this.mark_unread_ids();
        this.clear_badge();
    },
    
    /**
     * Populates from cache
     * @param Boolean   no_transition     Whether to skip the transition or not
     */
    fetch_cache: function(no_transition) {
        var data = window.localStorage.getItem(KEYS.NOTIFICATIONS_CACHE);
        if(data) {
            data = JSON.decode(data);
            var view = new NotificationsView(data, this, no_transition);
            
            return true;
        }
        return false;
    },
    
    /**
     * Populates from Ajax call
     */
    fetch_content: function() {
        var notificationsurl = "https://api.facebook.com/method/notifications.getList?include_read=true&access_token=" + this.get_access_token() + '&format=json';
        this.make_graph_call(notificationsurl, this.callback.bind(this));
    },
    
    /**
     * Callback for fetch_content
     */
    callback: function(resp) {
        this.spinner.hide();
        this.reenable_force_fresh.delay(3000, this);
        
        if(resp.error_code) {
            if(resp.error_code == 190) {
                window.localStorage.removeItem(KEYS.FB_ACCESS_TOKEN);
                new LoginController();
            }
            else {
                console.log(resp.error_msg);
            }
        }
        else if(this.results_differ(resp.notifications, JSON.decode(window.localStorage.getItem(KEYS.NOTIFICATIONS_CACHE)))) {
            // Create the view
            var view = new NotificationsView(resp.notifications, this);
            // Update cache
            this.update_cache(KEYS.NOTIFICATIONS_CACHE, JSON.encode(resp.notifications));
        }
    },
    
    /**
     * Compares notifications results
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
                if(new_results[i].body_html != old_results[i].body_html) {
                    return true;
                }
                else if(new_results[i].created_time != old_results[i].created_time) {
                    return true;
                }
                else if(new_results[i].notification_id != old_results[i].notification_id) {
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
        if(this.unread_ids.length > 0) {
            var mark = new Request.JSONP({
                url: 'https://api.facebook.com/method/notifications.markRead',
                data: {
                    access_token: pokki.descramble(window.localStorage.getItem(KEYS.FB_ACCESS_TOKEN)),
                    notification_ids: this.unread_ids,
                    format: 'json'
                },
                onComplete: function() {
                    this.unread_ids = [];    
                }.bind(this)
            }).send();
        }
    },
});