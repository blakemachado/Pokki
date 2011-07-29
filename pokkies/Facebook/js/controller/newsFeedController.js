/**
 * Facebook Pokki / newsFeedController.js - Controls the News Feed Tab
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

var NewsFeedController = new Class({
    Extends: BaseTabController,
    
    /**
     * Initialization (see BaseTabController class)
     */
    initialize: function(tab, content, tabs_selector, unread_key, show) {
        this.parent(tab, content, tabs_selector, unread_key, show);
        
        // delete default spinner
        this.spinner.destroy();
        // create special spinner for news feed
        this.spinner = new Spinner(this.content, {
            img: false,
            content: {
                class: 'spinner-content news_feed',
                html: '<img src="img/no-news_feed.png" />Accessing your feed...'
            }
        });
    },
    
    /**
     * Tab onShow event
     */
    onShow: function() {
        this.parent();
        
        if($('status_updater')) {
            $('status_updater').reset();
            $('status_updater').update.fireEvent('blur');
        }
    },
    
    /**
     * Populates from cache
     * @param Boolean   no_transition     Whether to skip the transition or not
     */
    fetch_cache: function(no_transition) {
        var data = window.localStorage.getItem(KEYS.NEWS_FEED_CACHE);
        if(data) {
            data = JSON.decode(data);
            var view = new NewsFeedView(data, this, no_transition);
            
            return true;
        }
        return false;
    },
    
    /**
     * Populates from Ajax call
     */
    fetch_content: function() {
        var newsfeedurl = "https://graph.facebook.com/me/home?filter_key=nf&access_token=" + this.get_access_token();
        this.make_graph_call(newsfeedurl, this.callback.bind(this));
    },
    
    /**
     * Callback for fetch_content
     */
    callback: function(resp) {
        this.spinner.hide();
        this.reenable_force_fresh.delay(3000, this);
        
        if(resp.error) {
            if(resp.error.type == 'OAuthException') {
                window.localStorage.removeItem(KEYS.FB_ACCESS_TOKEN);
                new LoginController();
            }
        }
        else if(this.results_differ(resp.data, JSON.decode(window.localStorage.getItem(KEYS.NEWS_FEED_CACHE)))) {
            // Create the view
            var view = new NewsFeedView(resp.data, this);
            // Update cache
            this.update_cache(KEYS.NEWS_FEED_CACHE, JSON.encode(resp.data));
        }
        else if(this.from_logout) {
            // Create the view
            var view = new NewsFeedView(resp.data, this);
            this.from_logout = false;
        }
    },
    
    /**
     * Compares news feed results
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
        else if(new_results.length > 0 && old_results.length > 0 && new_results[0].id != old_results[0].id) {
            return true;
        }
        
        return false;
    },
    
    /**
     * Submit a "like" to a news feed post
     */
    add_like: function(post_id) {
        var el = $('like-' + post_id);
        var url = 'https://api.facebook.com/method/stream.addLike?format=json&access_token=' + this.get_access_token();
        url += '&post_id=' + post_id;
        
        // remove onclick
        el.removeEvents('click');
        
        this.make_graph_call(url, function(resp) {
            var el = $('like-' + post_id);
            if(resp === true) {
                // update display
                if($('bling-' + post_id))
                    $('bling-' + post_id).fireEvent('like_up');
                el.set('text', 'Unlike');
                // add click event to remove like
                el.addEvent('click', this.remove_like.bind(this, post_id));
                
                GA.trackPageView('/' + this.tab.id + '/like');
            }
            else if(resp.error_code == 200) {
                // user didn't allow publish_stream, message accordingly
                PERM_Controller = new PermissionsController($(CONTENT.MAIN));
                // add click event to add like again
                el.addEvent('click', this.add_like.bind(this, post_id));
            }
            else if(DEBUG) {
                console.error(resp.error_msg);
            }
        }.bind(this));
    },
    
    /**
     * Submit a "like" removal from a news feed post
     */
    remove_like: function(post_id) {
        var el = $('like-' + post_id);
        var url = 'https://api.facebook.com/method/stream.removeLike?format=json&access_token=' + this.get_access_token();
        url += '&post_id=' + post_id;
        
        // remove onclick
        el.removeEvents('click');
        
        this.make_graph_call(url, function(resp) {
            var el = $('like-' + post_id);
            if(resp === true) {
                // update display
                if($('bling-' + post_id))
                    $('bling-' + post_id).fireEvent('like_down');
                el.set('text', 'Like');
                // add click event to add like
                el.addEvent('click', this.add_like.bind(this, post_id));
                
                GA.trackPageView('/' + this.tab.id + '/unlike');
            }
            else if(resp.error_code == 200) {
                // user didn't allow publish_stream, message accordingly
                PERM_Controller = new PermissionsController($(CONTENT.MAIN));
                // add click event to remove like again
                el.addEvent('click', this.remove_like.bind(this, post_id));
            }
            else if(DEBUG) {
                console.error(resp.error_msg);
            }
        }.bind(this));
    },
    
    /**
     * Submit a "comment" to a news feed post
     */
    add_comment: function(post_id, comment, callback) {
        var r = new Request.JSONP({
            url: 'https://api.facebook.com/method/stream.addComment',
            data: {
                format: 'json',
                access_token: this.get_access_token(),
                post_id: post_id,
                comment: comment
            },
            onComplete: callback
        }).send();
    },
    
    /**
     * Submit a status update
     */
    status_update: function(status, callback, failed_callback) {
        if(DEBUG) console.log('[STATUS UPDATE CONTROLLER]', status);
        
        var user = this.get_user();
        var r = new Request.JSON({
            url: 'https://graph.facebook.com/' +  user.id + '/feed',
            data: {
                format: 'json',
                access_token: this.get_access_token(),
                message: status,
                actions: JSON.encode([{
                        name: 'Get Pokki',
                        link: 'http://www.pokki.com'
                   }])
            },
            method: 'POST',
            onComplete: callback,
            onFailure: failed_callback
        }).send();
    }
});