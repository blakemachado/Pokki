/**
 * Facebook Pokki / app.js - core pokki javascript file
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     2.1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * 				Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */


var pokki_controllers = Array();
var NF_Controller = false;
var FR_Controller = false;
var MS_Controller = false;
var EV_Controller = false;
var NO_Controller = false;
var PERM_Controller = false;
var SEARCH_Controller = false;
var _LOGGED_IN = false;


window.addEventListener('load', onLoad, false);
function onLoad() {
	
	console.log('Debug Mode: '+DEBUG);
	console.log('GA Enabled: '+GA_ENABLED);

	// attach close click event
	$('close_pokki').addEvent('click', function() {
		pokki.closePopup();
	});
	
	// restore tab state
	var active_tab = false;
	if( window.localStorage.getItem(KEYS.FB_ACCESS_TOKEN)) {
		active_tab = window.localStorage.getItem(KEYS.ACTIVE_TAB);
		active_tab = active_tab ? active_tab : TABS.DEFAULT_TAB;
	}
	
	// setup tabs
	NF_Controller = new NewsFeedController($(TABS.NEWS_FEED), $(CONTENT.NEWS_FEED), CONTENT.NAV_MENU_ITEMS, '', TABS.NEWS_FEED == active_tab);
	FR_Controller = new FriendRequestsController($(TABS.FRIEND_REQUESTS), $(CONTENT.FRIEND_REQUESTS), CONTENT.NAV_MENU_ITEMS, KEYS.UNREAD_FRIEND_REQUESTS, TABS.FRIEND_REQUESTS == active_tab);
	MS_Controller = new MessagesController($(TABS.MESSAGES), $(CONTENT.MESSAGES), CONTENT.NAV_MENU_ITEMS, KEYS.UNREAD_MESSAGES, TABS.MESSAGES == active_tab);
	NO_Controller = new NotificationsController($(TABS.NOTIFICATIONS), $(CONTENT.NOTIFICATIONS), CONTENT.NAV_MENU_ITEMS, KEYS.UNREAD_NOTIFICATIONS, TABS.NOTIFICATIONS == active_tab);
	EV_Controller = new EventsController($(TABS.EVENTS), $(CONTENT.EVENTS), CONTENT.NAV_MENU_ITEMS, KEYS.UNREAD_EVENTS, TABS.EVENTS == active_tab);

	// setup Search
	SEARCH_Controller = new SearchController();

	pokki_controllers = [NF_Controller, FR_Controller, MS_Controller, NO_Controller, EV_Controller];
	
	// Clear the friends cache
	window.localStorage.removeItem(KEYS.FRIENDS);
	
	// link event delegation to load <a> links in new window
	$(CONTENT.WRAPPER).addEvent('click:relay(a).external', function(event, clicked) {
		GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/external');
		event.stop();
		var clicked_href = $(clicked).href;
		
		// Facebook login url redirector strips out this parameter so let them display the "You must log in..."
		if(clicked_href.contains('story_fbid') || clicked_href.contains('fbid')) {
			pokki.openURLInDefaultBrowser(clicked_href);
		}
		else if(clicked_href.contains('http://www.facebook.com') || clicked_href.contains('https://www.facebook.com')) {
			var user = JSON.decode(pokki.descramble(window.localStorage.getItem(KEYS.FB_USER)));
			var url = 'https://www.facebook.com/n/?';
			url += encodeURIComponent(clicked_href);
			url += '&n_m=' + user.email;
			
			pokki.openURLInDefaultBrowser(url);
		}
		else {
			pokki.openURLInDefaultBrowser(clicked_href);
		}
		
		pokki.closePopup();
	});
	
	
	// Logged IN
	if (window.localStorage.getItem(KEYS.FB_ACCESS_TOKEN)) {
		update_news_feed();
		$('splash_message').addClass('hide');
		$('splash_loading').removeClass('hide');	
		// new initial loading of tab
		var active_tab = window.localStorage.getItem(KEYS.ACTIVE_TAB);
		active_tab = active_tab ? active_tab : TABS.DEFAULT_TAB;
		if (active_tab.contains('tab-')) {
			Util.logout(true);
			new LoginController();
		} else {
			$(active_tab).fireEvent('show');
		}
	}
}



// pokki.rpc method for background to update individual tab badges
var update_badges = function() {
	pokki_controllers.each(function(item) {
		item.fireEvent('badgeupdate');
	});
};
var update_news_feed = function() {
	if (NF_Controller /*&& NF_Controller.is_showing()*/ && _LOGGED_IN) {
		if (DEBUG) console.log('Updating news feed from cache');
		NF_Controller.fetch_cache(true);
	}
};
var update_notifications = function() {
	if (NO_Controller /*&& NO_Controller.is_showing()*/ && _LOGGED_IN) {
		if (DEBUG) console.log('Updating notifications from cache');
		NO_Controller.fetch_cache(true);
	}
};
var update_friend_requests = function() {
	if (FR_Controller /*&& FR_Controller.is_showing()*/ && _LOGGED_IN) {
		if (DEBUG) console.log('Updating friend requests from cache');
		FR_Controller.fetch_cache(true);
	}
};
var update_messages = function() {
	if (MS_Controller /*&& MS_Controller.is_showing()*/ && _LOGGED_IN) {
		if (DEBUG) console.log('Updating messages from cache');
		MS_Controller.fetch_cache(true);
	}		
};
var update_events = function() {
	if (EV_Controller /*&& EV_Controller.is_showing()*/ && _LOGGED_IN) {
		if (DEBUG) console.log('Updating events from cache');
		EV_Controller.fetch_cache(true);
	}		
};

var splash_on = function() {
	return $(CONTENT.WRAPPER).hasClass('splash');
};



pokki.addEventListener('popup_shown', function() {
	
	
	// Logged IN
	if (window.localStorage.getItem(KEYS.FB_ACCESS_TOKEN)) {
		_LOGGED_IN = true;
		if (DEBUG) console.log('YOU ARE LOGGED IN');
		
		var hide_tabs = false;
		var permissions = JSON.decode(window.localStorage.getItem(KEYS.PERMISSIONS));
		if(permissions && !permissions.flag && !permissions.shown) {
			// prompt user about permissions missing
			PERM_Controller = new PermissionsController($(CONTENT.WRAPPER));
			$$(CONTENT.NAV_MENU_ITEMS).hide();
			hide_tabs = true;
		}
		
		// splash is present - first load only
		if ($(CONTENT.WRAPPER).hasClass('splash')) {
			// Show the splash screen when popup is shown
			$(CONTENT.SPLASH).removeClass('out').addClass('animate');
			
			update_news_feed();
			$('splash_message').addClass('hide');
			$('splash_loading').removeClass('hide');
			$$('.quicklist').destroy();
		
			Util.add_logout_context();

			// new initial loading of tab
			var active_tab = window.localStorage.getItem(KEYS.ACTIVE_TAB);
			active_tab = active_tab ? active_tab : TABS.DEFAULT_TAB;
			$(active_tab).fireEvent('show');
			$(active_tab).fireEvent('trackBadgeCount');
			
		}
		// all other times, if no permission errors
		else if(!hide_tabs) {
			$$(CONTENT.NAV_MENU_ITEMS).show();
			var active_tab = window.localStorage.getItem(KEYS.ACTIVE_TAB);
			active_tab = active_tab ? active_tab : TABS.DEFAULT_TAB;
			$(active_tab).fireEvent('popup_shown');
		}
		
		
		
	}
	// Logged OUT
	else {
		if (DEBUG) console.log('YOU ARE NOT LOGGED IN');
	   			
		// Show the splash screen when popup is shown
		$(CONTENT.SPLASH).removeClass('out').addClass('animate');
	   			
		(function() {
			var lc = new LoginController();
			lc.track_badge_count();
		}).delay(1000);
	}	
});




// setup content when popup is hidden
pokki.addEventListener('popup_hidden', function() {
	
	if( ! window.localStorage.getItem(KEYS.FB_ACCESS_TOKEN)) {
		$$(CONTENT.NAV_MENU_ITEMS).hide();
		$('splash_message').addClass('hide').removeClass('animate');
		$(CONTENT.SPLASH).removeClass('animate');
		$(CONTENT.WRAPPER).addClass('splash');
	}
	
	if(PERM_Controller) {
		PERM_Controller.hide();
		PERM_Controller = false;
	}
	
	var active_tab = window.localStorage.getItem(KEYS.ACTIVE_TAB);
	active_tab = active_tab ? active_tab : TABS.DEFAULT_TAB;
	$(active_tab).fireEvent('popup_hidden');
	
});

// add handling for links opening in _blank new window               
pokki.addEventListener('new_window', function(url) {
	if(DEBUG) console.log('[NEW WINDOW]', url);
	pokki.openURLInDefaultBrowser(url);
	pokki.closePopup();
});

// add event handling for context menu items
pokki.addEventListener('context_menu', function(id) {
	switch(id) {
		case 'logout':
			Util.logout();
			break;
	}
});