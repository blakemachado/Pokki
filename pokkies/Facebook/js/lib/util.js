/**
 * Facebook Pokki / util.js - Utility functions for the Facebook Pokki
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */

var Util = {
    /**
     * Parses the hash value of a url and returns the values as a JSON object
     */
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
    
    /**
     * Linkifies text
     */
    linkify: function(text) {
        if(!text) return text;
        
        text = text.replace(/((https?\:\/\/|ftp\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi, function(url){
                return '<a href="'+ url +'">'+ url +'</a>';
        });

        return text;
    },
    
    /**
     * Epoch time converter
     */
    get_current_epoch_time: function() {
        var today = new Date();
        return Math.round(today.getTime()/1000.0);
    },
    
    /**
     * Splash transition
     */
    transition_splash_out: function(hide_tabs) {
        if(!hide_tabs)
            $$('#tabs li').show();
        
        (function() {
            // Reload window size
            pokki.setPopupClientSize(558, 415);
            if($('splash-box')) {
                $('splash-box').addClass('disabled');
                
                (function() {
                    $('splash-box').destroy();
                }).delay(100);
            }
        }).delay(250);
        
        if($('splash')) {
            $('splash').setStyles({
                '-webkit-animation-name': 'splash_leave',
                '-webkit-animation-duration': '250ms'    
            });
            
            $('splash-box').setStyles({
                '-webkit-animation-name': 'fadeOut',
                '-webkit-animation-duration': '250ms' ,
                '-webkit-animation-iteration-count': 1
            });
        }
    },
    
    /**
     * Allows messaging to the user via splash screen
     */
    add_splash_message: function(msg) {
        if($('splash_message')) {
            $('splash_message').innerHTML = msg;
            $('splash_message').removeClass('hide');
        }
    },
    
    /**
     * Constructs the HTML for comments in a newsfeed post
     * Note: this really shouldn't be placed here...
     */
    build_comments: function(data) {
        var comment_ul = '';
        var comment_template = $('newsfeed_comment_template').innerHTML;
        
        for(var i = 0; i < data.length; i++) {
            var comment_data = {};                
            comment_data.user_url = 'http://www.facebook.com/profile.php?id=' + data[i].from.id;
            comment_data.user_image = 'http://graph.facebook.com/' + data[i].from.id + '/picture';
            comment_data.user_name = data[i].from.name;
            comment_data.id = data[i].id;
            comment_data.comment = data[i].message;
            comment_data.time = new Date().parse(data[i].created_time).timeDiffInWords();;
            comment_data.actions = '';
            
            comment_ul += '<li class="cmt clearfix" id="cmt-' + data[i].id + '">';
            comment_ul += comment_template.substitute(comment_data);
            comment_ul += '</li>';
        }
        
        return comment_ul;
    },
    
    /**
     * Compares two message results and decides if they differ based on number returned, message text or comments
     * Note: this also shouldn't be placed here...
     */
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
    
    /**
     * Util for creating the context menu
     */
    add_logout_context: function() {
        pokki.resetContextMenu();
        pokki.addContextMenuItem('Log out', 'logout');
    },
    
    /**
     * Log out logic for the popup
     */
    logout: function() {
        _LOGGED_IN = false;
        
        // logout event
        var active_tab = TABS.DEFAULT_TAB;
        $(active_tab).fireEvent('logout');
        
        // prepare for first state again
        if(! $('splash-box')) {
            $(document.body).grab(new Element('div', {
                id: 'splash-box',
                html: '<div id="splash"></div><div id="splash_message" class="hide"></div>'
            }));
        }
        
        $('splash').addClass('animate');
        $('splash_message').addClass('animate');
        
        // message to user that they're being logged out
        Util.add_splash_message('Logging out of Facebook<span class="dot1">.</span><span class="dot2">.</span><span class="dot3">.</span>');
        
        (function() {
            // goodbye
            pokki.closePopup();
        }).delay(550);
    },
    
    /**
     * Log out logic for the background
     */
    background_logout: function()  {
        // reset localstorage keys
        for(key in KEYS) {
            window.localStorage.removeItem(KEYS[key]);
        }
        // reset context menu
        pokki.resetContextMenu();
        // clear websheet cookies so next user to log in doesn't get auto-logged into previous user's account
        pokki.clearWebSheetCookies();
        // clear badges
        pokki.removeIconBadge();
        // reset global var
        _LOGGED_IN = false;
    }
};

/**
 * Wrapper for ga_pokki so that I can disable analytics tracking when in dev mode
 * to prevent erroneous values from being sent
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