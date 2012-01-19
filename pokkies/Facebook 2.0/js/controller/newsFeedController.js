/**
 * Facebook Pokki / newsFeedController.js - Controls the News Feed Tab
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

var NewsFeedController = new Class({
    Extends: BaseTabController,
    
	/**
	 * Initialization (see BaseTabController class)
	 */  
    initialize: function(tab, content, tabs_selector, unread_key, show) {
        this.parent(tab, content, tabs_selector, unread_key, show);        
        this.view = null;
    },
	/**
	 * Tab onShow event
	 */   
    onShow: function() {
    	// Remove all the other remaining content besides the first    	
    	this.content.getElements('.nfList:first-child').setStyle('margin-bottom', 0);
    	this.content.getElements('.nfList:not(:first-child)').destroy();
        this.parent();
        // Setup Status Updater
        if ($('status_updater')) {
            $('status_updater').reset();
            $('status_updater').update.fireEvent('blur');
        }
    },
    
    onHide: function() {
    	if (this.is_showing() && !this.content.getElement('.no-items')) {
    		
    		// Hide the more button so it doesn't trigger the scroll event to load more
		    var more_button = $(MORE.NEWS_FEED).addClass('hide');
	    	// Logic to keep the visible content remain while transitioning out
	    	var bottom_margin = 0, list_top = 0, list_height = 0, list_bottom = 0;
	    	var lists = this.content.getElements('.nfList');
	    	var first_list = lists.splice(0,1)[0];
	    	// loop through each infinite-scrolled "page"
	    	for (var i = 0; i < lists.length; i++) {
	    		list_top = lists[i].getPosition().y;
	    		list_height = lists[i].getSize().y;
	    		list_bottom = list_top+list_height;
	    		//console.log('['+i+']', list_height+': '+list_top+' to '+list_bottom);
	    		if (list_bottom <= 1) {
	    			// if content is above the visible viewport
	    			//console.log('above. destroyed');
		    		bottom_margin += list_height;
		    		first_list.setStyle('margin-bottom', bottom_margin);	    		
	    			lists[i].destroy();
	    		} else if (list_top > CHROME.HEIGHT) {
		    		// if content is below the visible viewport
		    		//console.log('below. destroyed');
	    			lists[i].destroy();
	    		}	    		
	    	}
	    	// Reset the load-more button to the initial stage
	    	more_button.setProperty('more', more_button.getProperty('init_more'));
	    }
	    this.parent();
    },
    
    fetch_cache: function(no_transition) {
    	if (DEBUG) console.log('[NEWS FEED]', 'Fetching Cache');
        var data = window.localStorage.getItem(KEYS.NEWS_FEED_CACHE);
        if (data) {
            data = JSON.decode(data);
            this.view = new NewsFeedView(data, this, no_transition);            
            return true;
        }
        return false;
    },
    
    fetch_content: function(no_transition) {
    	if (DEBUG) console.log('[NEWS FEED]', 'Fetching Content');
        this.make_graph_call(
        	"https://graph.facebook.com/me/home",
        	{
        		filter_key: 'nf',
        		access_token: this.get_access_token()
        	},
        	this.callback.bind(this)
        );
    },
    
    fetch_more_content: function(url) {
    	if (DEBUG) console.log('[NEWS FEED]', 'Fetching More Content');
    	this.make_graph_call(
    		url,
    		{},
    		(function(resp) {
	    		if (resp.error) {
	    			if (resp.error.message.contains('(#4)') || resp.error.message.contains('request limit reached')) {
	    				pokki.rpc('stop_badge_poll();');
	    				pokki.rpc('test_badge_poll();');
	    				console.log(resp.error.message);
	    			} else if (resp.error.message) {
	    				console.log(resp.error.message);
	    			}			
	    		} else {
	    			this.view.append_content(resp);
	    		}
    		}).bind(this)
    	);
    },
    
    callback: function(resp) {
    	var no_transition = false;
    	if (!this.is_showing()) 
    		no_transition = true;
    
    	if (DEBUG) console.log('[NEWS FEED] Callback transition', no_transition);
        this.spinner.hide();
        this.reenable_force_fresh.delay(3000, this);
        
        if(resp.error) {
            if(resp.error.type == 'OAuthException') {
                window.localStorage.removeItem(KEYS.FB_ACCESS_TOKEN);
                new LoginController();
            }
            else if (resp.error.message.contains('(#4)') || resp.error.message.contains('request limit reached')) {
            	pokki.rpc('stop_badge_poll();');
            	pokki.rpc('test_badge_poll();');
            	console.log(resp.error.message);
            } else if (resp.error.message) {
            	console.log(resp.error.message);
            }
        }
        else if(this.results_differ(resp, JSON.decode(window.localStorage.getItem(KEYS.NEWS_FEED_CACHE)))) {
            // Create the view
            this.view = new NewsFeedView(resp, this, no_transition);
            // Update cache
            this.update_cache(KEYS.NEWS_FEED_CACHE, JSON.encode(resp));
			//this.update_cahce(KEYS.NEWS_FEED_PAGINATION, JSON.encode(resp.pagination));
        }
        else if(this.from_logout) {
            // Create the view
            this.view = new NewsFeedView(resp, this, no_transition);
            this.from_logout = false;
        }
    },
    
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
    
    add_like: function(post_id) {
        var el = $('like-' + post_id);        
        // remove onclick
        el.removeEvents('click');
        
        var callUrl = 'https://graph.facebook.com/'+post_id+'/likes?access_token='+this.get_access_token();
        new Request({
        	url: callUrl,
        	onComplete: function(resp) {
	        	if (DEBUG) console.log('[Add Like]', resp);
	        	var el = $('like-' + post_id);
	        	if (resp || resp === true) {
	        	    // update display
	        	    if($('bling-' + post_id))
	        	        $('bling-' + post_id).fireEvent('like_up');
	        	    el.set('text', 'Unlike');
	        	    // add click event to remove like
	        	    el.addEvent('click', this.remove_like.bind(this, post_id));
	        	    GA.trackPageView('/' + this.tab.id + '/like');
	        	}
	        	else if (resp && (resp.error || resp.error_code)) {
	        		if (resp.error_code == 200) {
		        	    // user didn't allow publish_stream, message accordingly
		        	    PERM_Controller = new PermissionsController($(CONTENT.WRAPPER));
		        	    // add click event to add like again
		        	    el.addEvent('click', this.add_like.bind(this, post_id));
		        	}
	        	}
	        	else {
	        		el.hide();	        	
	        	}
        	}.bind(this)
        }).post();
        
    },
    
    remove_like: function(post_id) {
        var el = $('like-' + post_id);
        // remove onclick
        el.removeEvents('click');
        
        var callUrl = 'https://graph.facebook.com/'+post_id+'/likes?access_token='+this.get_access_token();
        new Request({
        	url: callUrl,
        	onComplete: function(resp) {
	        	if (DEBUG) console.log('[Remove Like]', resp);
            	var el = $('like-' + post_id);
            	if (resp || resp === true) {
            	   // update display
            	   if($('bling-' + post_id))
            	       $('bling-' + post_id).fireEvent('like_down');
            	   el.set('text', 'Like');
            	   // add click event to add like
            	   el.addEvent('click', this.add_like.bind(this, post_id));
              	   GA.trackPageView('/' + this.tab.id + '/unlike');
              	}
  	        	else if (resp && (resp.error || resp.error_code)) {
              		if (resp.error_code == 200) {
              		    // user didn't allow publish_stream, message accordingly
              		    PERM_Controller = new PermissionsController($(CONTENT.WRAPPER));
              		    // add click event to add like again
              		    el.addEvent('click', this.add_like.bind(this, post_id));
              		}
              	}
              	else {
              		el.hide();	        	
              	}
        	}.bind(this)
        }).delete();        
        
    },
    
    add_comment: function(post_id, comment, callback) {    
    	var callUrl = 'https://graph.facebook.com/'+post_id+'/comments?access_token='+this.get_access_token();
    	new Request({
    		url: callUrl,
    		data: {
    			message: comment
    		},
    		onComplete: callback
    	}).post();
    },
    
    remove_comment: function(comment_id, callback) {
        // comment_id
        //https://api.facebook.com/method/stream.removeComment?access_token=
    },
    
    status_update: function(status, callback, failed_callback) {
        if(DEBUG) console.log('[STATUS UPDATE CONTROLLER]', status);
        
        var user = this.get_user();
        
        if (DEBUG) console.log('[GRAPH CALL] Status Update: https://graph.facebook.com/' +  user.id + '/feed');
        
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