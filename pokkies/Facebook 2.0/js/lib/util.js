/**
 * Facebook Pokki / util.js - Utility functions for the Facebook Pokki
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     2.1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * 				Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */
var Util = {
    parse_url_hash: function(url) {
        var indexOfHash = url.indexOf('#');
        var hashString = url.substring(indexOfHash + 1, url.length);
        var keyValuePairs = hashString.split('&');
        
        var retVal = '{';
        
        for(var i = 0; i < keyValuePairs.length; i++) {
            if(i > 0) {
                retVal += ',';
            }
            var keyValuePair = keyValuePairs[i].split('=');
            retVal += '\'' + keyValuePair[0] + '\'' + ':' + '\'' + keyValuePair[1] + '\'';
        }
        
        retVal += '}';
        
        return JSON.decode(retVal);
    },
    
    linkify: function(text) {
        if(!text) return text;
        
        text = text.replace(/((https?\:\/\/|ftp\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi, function(url){
                return '<a href="'+ url +'">'+ url +'</a>';
        });

        return text;
    },
    
    get_current_epoch_time: function() {
        var today = new Date();
        return Math.round(today.getTime()/1000.0);
    },
    
    transition_splash_out: function(hide_tabs) {
        if(!hide_tabs)
            $$('#nav_menu li').show();
        
        (function() {
            // Reload window size
            pokki.setPopupClientSize(CHROME.WIDTH, CHROME.HEIGHT);
			if($(CONTENT.WRAPPER).hasClass('splash')) {
			    $(CONTENT.SPLASH).removeClass('animate').addClass('out');            
			    $(CONTENT.WRAPPER).removeClass('splash');
			}
        }).delay(250);
        
        
    },
    
    add_splash_message: function(msg) {
        if($('splash_message')) {
            $('splash_message').innerHTML = msg;
            $('splash_message').removeClass('hide');
        }
    },
    
    build_comments: function(data) {
        var comment_ul = '';
        var comment_template = $('newsfeed_comment_template').innerHTML;
        
        for(var i = 0; i < data.length; i++) {
            var comment_data = {};                
            comment_data.user_url = 'http://www.facebook.com/profile.php?id=' + data[i].from.id;
            comment_data.user_image = 'http://graph.facebook.com/' + data[i].from.id + '/picture';
            comment_data.user_name = data[i].from.name;
            comment_data.id = data[i].id;
            comment_data.comment = Util.linkify(data[i].message);
            comment_data.time = new Date().parse(data[i].created_time).timeDiffInWords();;
            comment_data.actions = '';
            
            comment_ul += '<li class="cmt clearfix" id="cmt-' + data[i].id + '">';
            comment_ul += comment_template.substitute(comment_data);
            comment_ul += '</li>';
        }
        
        return comment_ul;
    },
    
    message_results_differ: function(new_results, old_results) {
        if(!old_results || old_results.length == 0)
            return true;
        
        if(old_results.length != new_results.length || old_results.length == 0 || new_results.length == 0) {
            return true;
        }
        else {
            if(new_results[0].id != old_results[0].id) {
                return true;
            }
            else if(new_results[0].message != old_results[0].message) {
                return true;
            }
            else if(new_results[0].comments && old_results[0].comments && new_results[0].comments.data.length != old_results[0].comments.data.length) {
                return true;
            }
        }
        
        return false;
    },
    
    add_logout_context: function() {
        pokki.resetContextMenu();
        pokki.addContextMenuItem('Log out', 'logout');
    },
    
    logout: function(leave_pokki_open) {
        _LOGGED_IN = false;
        
        // logout event
        var active_tab = TABS.DEFAULT_TAB;
        $(active_tab).fireEvent('logout');
        
        Util.background_logout();
        
        // prepare for first state
        $(CONTENT.WRAPPER).removeClass('sub').addClass('splash');            
        //Util.add_splash_message('Logging out of Facebook');
        
        if (!leave_pokki_open) {
	        (function() {
	            pokki.closePopup();
	      	}).delay(800);
	    }
    },
    
    background_logout: function()  {
        // reset localstorage keys
        for(key in KEYS) {
            window.localStorage.removeItem(KEYS[key]);
        }
        // reset other stuff
        (function() {
	        if (DEBUG) console.log('Logout reset');
            $$('#wrapper .main .content .tab_content').each(function(item) {
            	item.empty();
            });
       	}).delay(1000);
        pokki.resetContextMenu();
        pokki.clearWebSheetCookies();
        pokki.removeIconBadge();
        _LOGGED_IN = false;
    }
};

/**
 * Wrapper for ga_pokki
 */
var GA = {
    trackPageView: function(page, title) {
        if(GA_ENABLED) {
            ga_pokki._trackPageview(page, title);
        }
    },
    
    trackEvent: function(category, action, label, value) {
        if(GA_ENABLED) {
            ga_pokki._trackEvent(category, action, label, value);
        }
    }
};