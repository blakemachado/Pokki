/**
 * Facebook Pokki / friendRequestsController.js - Controls the Friend Requests Tab
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

var FriendRequestsController = new Class({
    Extends: BaseTabController,
    /**
      * Initialization (see BaseTabController class)
      */
    initialize: function(tab, content, tabs_selector, unread_key, show) {
        this.parent(tab, content, tabs_selector, unread_key, show);
    },
    
    fetch_cache: function(no_transition) {
    	if (DEBUG) console.log('[FRIENDS REQUESTS]', 'Fetching Cache');
        var data = JSON.decode(window.localStorage.getItem(KEYS.FRIEND_REQUESTS_CACHE));
        if (data) {        	
        	if (data.error || data.error_code) {
        		this.fetch_content();
        	}
        	var view = new FriendRequestsView(data, this, no_transition);
            return true;
        }
        return false;
    },
    
    fetch_content: function() {
    	if (DEBUG) console.log('[FRIENDS REQUESTS]', 'Fetching Content');
        var user = this.get_user();
        
        if(user) {            
            this.make_graph_call(
            	"https://graph.facebook.com/fql",
            	{
            	   	q: 'SELECT uid, name FROM user WHERE uid IN (SELECT uid_from FROM friend_request WHERE uid_to=' + user.id + ')',
            	   	access_token: this.get_access_token(),
            	   	format: "json"
            	},
            	this.callback.bind(this)
            );
        }
    },
    
    callback: function(resp) {
        this.spinner.hide();
        this.reenable_force_fresh.delay(3000, this);
        if (resp.error || resp.error_code || resp.error_msg) {
	        if (DEBUG) console.log('[FR data error]', resp);
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
        else if (this.results_differ(resp.data, JSON.decode(window.localStorage.getItem(KEYS.FRIEND_REQUESTS_CACHE)))) {
           	if (DEBUG) console.log('[FR data no error]', resp.data);
            // Create the view
            var view = new FriendRequestsView(resp.data, this);
            // Update cache
            this.update_cache(KEYS.FRIEND_REQUESTS_CACHE, JSON.encode(resp.data));
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
        else {
            for(var i = 0; i < new_results.length; i++) {
                if(new_results[i].uid != old_results[i].uid) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    
    //// not being used right now
    confirm_request: function(friend_id) {
        var loginurl = 'https://www.facebook.com/dialog/oauth?client_id=' + pokki.getScrambled(FB_APP_ID) + '&response_type=token&display=popup&redirect_uri=';
        var requrl = 'https://www.facebook.com/dialog/friends?access_token=' +
                    this.get_access_token() +
                    '&api_key=' + pokki.getScrambled(FB_API_KEY) +
                    '&app_id=' + pokki.getScrambled(FB_APP_ID) +
                    '&display=popup&id=' + friend_id +
                    '&locale=en_US&next=http%3A%2F%2Fstatic.ak.fbcdn.net%2Fconnect%2Fxd_proxy.php%3Fversion%3D0%23cb%3Dff13870ac%26origin%3Dhttp%253A%252F%252Fdev.pokki.com%252Ffc113e174%26relation%3Dopener%26transport%3Dpostmessage%26frame%3Df279d739c8%26result%3D%2522xxRESULTTOKENxx%2522&sdk=joey';
                    
        pokki.showWebSheet(loginurl + encodeURIComponent(requrl),
            610,
            463,
            function(url) {
                console.log(url);
                
                // facebook success page
                if(url.contains('fbcdn.net/connect/xd_proxy.php')) {	
                    var params = Util.parse_url_hash(url);
                    
                    console.log(params);
                    
                    if(params.action && params.action == 1) {
                        // confirmed
                        var actions = $('fr_' + friend_id).getElement('.actions');
                        var feedback = new Element('span', {
                            class: 'uiButton uiButtonDisabled',
                            html: '<span>Request Confirmed</span>'
                        });
                        feedback.replaces(actions);             
                    }
                    else {
                        // hide
                        $('fr_' + friend_id).setStyle('overflow', 'hidden');
                        $('fr_' + friend_id).morph({height: 0, opacity: 0}).get('morph').chain(function() {
                            $('fr_' + friend_id).destroy();
                            
                            if(this.content.getElement('ul.frList').getChildren().length == 0) {
                                // No new friend requests messaging
                                var div = new Element('div', {
                                    class: 'no-items friend_requests',    
                                    html: '<img src="img/no-requests.png" />' +
                                        '<strong>Friend requests <a href="https://www.facebook.com/home.php?sk=ff">Search for a friend</a></strong>' +
                                        '<br />No new requests'
                                });
                                
                                this.content.empty();
                                this.content.setStyle('opacity', 0);
                                this.content.grab(div);
                                this.content.tween('opacity', 1);
                            }
                        }.bind(this));
                    }
                    
                    return true;
                }
                else {
                    return false;
                }
            }.bind(this),
            
            function(url_clicked) {
                // do nothing
            }
        );
    }
});