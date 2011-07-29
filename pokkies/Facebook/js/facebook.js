/**
 * Facebook Pokki / facebook.js - popup javascript file
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   Authors, 2011
 */

// Some Globals...
var pokki_controllers = Array();
var NF_Controller = false;
var FR_Controller = false;
var MS_Controller = false;
var NO_Controller = false;
var PERM_Controller = false;
var _LOGGED_IN = false;

/**
 * Initialize controllers and tabs onload
 */
window.addEventListener('load', onLoad, false);
function onLoad() {
    // attach click-thru for logo
    $('logo').addEvent('click', function() {
        GA.trackPageView('/logo');
        pokki.openURLInDefaultBrowser('http://www.facebook.com');
        pokki.closePopup();
    });
    
    // attach close click event
    $('button-close').addEvent('click', function() {
        pokki.closePopup();
    });
    
    // restore tab state
    var active_tab = false;
    if( window.localStorage.getItem(KEYS.FB_ACCESS_TOKEN)) {
        active_tab = window.localStorage.getItem(KEYS.ACTIVE_TAB);
        active_tab = active_tab ? active_tab : TABS.DEFAULT_TAB;
    }
    
    // setup tabs and controllers
    NF_Controller = new NewsFeedController($(TABS.NEWS_FEED), $(CONTENT.NEWS_FEED), '#tabs li', '', TABS.NEWS_FEED == active_tab);
    FR_Controller = new FriendRequestsController($(TABS.FRIEND_REQUESTS), $(CONTENT.FRIEND_REQUESTS), '#tabs li', KEYS.UNREAD_FRIEND_REQUESTS, TABS.FRIEND_REQUESTS == active_tab);
    MS_Controller = new MessagesController($(TABS.MESSAGES), $(CONTENT.MESSAGES), '#tabs li', KEYS.UNREAD_MESSAGES, TABS.MESSAGES == active_tab);
    NO_Controller = new NotificationsController($(TABS.NOTIFICATIONS), $(CONTENT.NOTIFICATIONS), '#tabs li', KEYS.UNREAD_NOTIFICATIONS, TABS.NOTIFICATIONS == active_tab);
    
    pokki_controllers = [NF_Controller, FR_Controller, MS_Controller, NO_Controller];
    
    // link event delegation to load <a> links in new window
    $(CONTENT.MAIN).addEvent('click:relay(a)', function(event, clicked) {
        GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/external');
        event.stop();
        var clicked_href = $(clicked).href;
        
        // Facebook login url redirector strips out this parameter so let them display the "You must log in..."
        if(clicked_href.contains('story_fbid') || clicked_href.contains('fbid')) {
            pokki.openURLInDefaultBrowser(clicked_href);
        }
        else {
            var user = JSON.decode(pokki.descramble(window.localStorage.getItem(KEYS.FB_USER)));
            var url = 'https://www.facebook.com/n/?';
            url += encodeURIComponent(clicked_href);
            url += '&n_m=' + user.email;
            
            pokki.openURLInDefaultBrowser(url);
        }
        
        pokki.closePopup();
    });
    
    // if splash isn't present, create it
    if(! $('splash-box')) {
        $(document.body).grab(new Element('div', {
            id: 'splash-box',
            html: '<div id="splash"></div><div id="splash_message" class="hide"></div>'
        }));
    }
}


/**
 * pokki.rpc method for updating badges from the background
 */
var update_badges = function() {
    pokki_controllers.each(function(item) {
        item.fireEvent('badgeupdate');
    });
};

/**
 * pokki.rpc method for updating the newsfeed from the background
 */
var update_news_feed = function() {
    if(DEBUG) console.log('Updating news feed from cache');
    if(NF_Controller && _LOGGED_IN) NF_Controller.fetch_cache(true);
};

/**
 * pokki.rpc method for updating notifications from the background
 */
var update_notifications = function() {
    if(DEBUG) console.log('Updating notifications from cache');
    if(NO_Controller && NO_Controller.is_showing() && _LOGGED_IN) NO_Controller.fetch_cache(true);
};

/**
 * pokki.rpc method for updating friend requests from the background
 */
var update_friend_requests = function() {
    if(DEBUG) console.log('Updating friend requests from cache');
    if(FR_Controller && FR_Controller.is_showing() && _LOGGED_IN) FR_Controller.fetch_cache(true);
};

/**
 * pokki.rpc method for updating messages from the background
 */
var update_messages = function() {
    if(DEBUG) console.log('Updating messages from cache');
    if(MS_Controller && MS_Controller.is_showing() && _LOGGED_IN) MS_Controller.fetch_cache(true);
};

/**
 * On popup_shown, display log in prompt or transition splash out 
 * and load the tabs
 */
pokki.addEventListener('popup_shown', function() {
    // refresh tab content when popup is shown again
    if($('splash-box') && !$('splash-box').hasClass('disabled'))
        $('splash-box').show();
        
    // Logged IN
    if(window.localStorage.getItem(KEYS.FB_ACCESS_TOKEN)) {
        if(DEBUG) console.log('YOU ARE LOGGED IN');
        
        var hide_tabs = false;
        var permissions = JSON.decode(window.localStorage.getItem(KEYS.PERMISSIONS));
        if(permissions && !permissions.flag && !permissions.shown) {
            // prompt user about permissions missing
            PERM_Controller = new PermissionsController($(CONTENT.MAIN));
            $$('#tabs li').hide();
            hide_tabs = true;
        }
        
        // splash is present - first load only
        if($('splash-box') && !$('splash-box').hasClass('disabled')) {
            $('splash').addClass('animate');
            $('splash_message').addClass('animate');
            
            // Create the context menu
            Util.add_logout_context();
            
            (function() {
                Util.transition_splash_out();
                // new initial loading of tab
                var active_tab = window.localStorage.getItem(KEYS.ACTIVE_TAB);
                active_tab = active_tab ? active_tab : TABS.DEFAULT_TAB;
                $(active_tab).fireEvent('show');
            }).delay(1000, Util, hide_tabs);
        }
        // all other times, if no permission errors
        else if(!hide_tabs) {
            $$('#tabs li').show();
            var active_tab = window.localStorage.getItem(KEYS.ACTIVE_TAB);
            active_tab = active_tab ? active_tab : TABS.DEFAULT_TAB;
            // tell the active tab that popup was shown
            $(active_tab).fireEvent('popup_shown');
        }
    }
    // Logged OUT
    else {
        if(DEBUG) console.log('YOU ARE LOGGED OUT');
        
        if($('splash-box') && !$('splash-box').hasClass('disabled')) {
            $('splash').addClass('animate');
            $('splash_message').addClass('animate');
        }
        (function() {
            var lc = new LoginController();
        }).delay(250);
    }
});

/**
 * On popup_hidden, reset splash if user has not logged in
 */
pokki.addEventListener('popup_hidden', function() {
    if( ! window.localStorage.getItem(KEYS.FB_ACCESS_TOKEN)) {
        $$('#tabs li').hide();
        if($('splash-box')) {
            $('splash_message').addClass('hide');
            $('splash').removeClass('animate');
            $('splash_message').removeClass('animate');
        }
    }
    
    // Hide the 'permissions needed' message if it was being displayed
    if(PERM_Controller) {
        PERM_Controller.hide();
        PERM_Controller = false;
    }
    
    var active_tab = window.localStorage.getItem(KEYS.ACTIVE_TAB);
    active_tab = active_tab ? active_tab : TABS.DEFAULT_TAB;
    // tell the active tab that popup was hidden
    $(active_tab).fireEvent('popup_hidden');
});

/**
 * Context menu event listener for popup
 */
pokki.addEventListener('context_menu', function(id) {
    switch(id) {
        case 'logout':
            Util.logout();
            break;
    }
});