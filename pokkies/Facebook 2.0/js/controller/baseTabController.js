/**
 * Facebook Pokki / baseTabController.js
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


var BaseTabController = new Class({
	Extends: BaseController,
	
	/**
	 * Initialize tab
	 * @param String/HTMLElement   tab         Tab to listen for
	 * @param String/HTMLElement   content     Corresponding content for tab
	 * @param String               tab_selector Selector to grab all tabs in the set
	 * @param String               unread_key  Local storage key to reference for unread count
	 * @param Boolean              show        Whether or not to initially activate this tab
	 */
	initialize: function(tab, content, tabs_selector, unread_key, show) {
		this.parent();
		this.tab = $(tab);
		this.content_id = content;
		this.content = $(this.content_id);
		this.tabs_selector = tabs_selector;
		this.badge = $(tab).getElement('.badge');
		this.unread_key = unread_key;
		
		// setup tab events
		this.tab.addEvent('click', this.show.bind(this));
		this.tab.addEvent('show', this.onShow.bind(this));
		this.tab.addEvent('hide', this.onHide.bind(this));
		this.tab.addEvent('popup_shown', this.onPopupShown.bind(this));
		this.tab.addEvent('popup_hidden', this.onPopupHidden.bind(this));
		this.tab.addEvent('trackBadgeCount', this.onTrackBadgeCount);
		this.tab.addEvent('logout', this.onLogout.bind(this));
		
		// setup badges
		this.addEvent('badgeupdate', this.onBadgeupdate.bind(this));
		this.fireEvent('badgeupdate');
		
		// setup loading image
		this.spinner = new Spinner(this.content.getParent('.content'));
		
		// setup scroll
		this.winscroll = new Fx.Scroll(this.content.getParent('.content'));
 
		// display tab
		if (show)
			window.localStorage.setItem(KEYS.ACTIVE_TAB, this.tab.id);
	},
	
	fetch_cache: function(no_transition) { return false; },
	fetch_content: function() { return false; },
	
	// tab click event
	show: function(e) {
		$$(CONTENT.SHOW_SUBCONTENT_ITEMS).removeClass('selected');
		$$(this.tabs_selector).each(function(tab) {
			if(tab != this.tab) {
				tab.fireEvent('hide');
			}
		}.bind(this));
		
		if (PERM_Controller) {
			PERM_Controller.hide();
		}
		
		if (SEARCH_Controller) {
			SEARCH_Controller.reset_field();
		}
		
		this.tab.fireEvent('show');
	},
	
	onShow: function() {
		if (DEBUG) console.log('[onShow]', this.tab.id);
		GA.trackPageView('/' + this.tab.id);
		this.tab.addClass('selected');
		
		// if tab is already visible and user clicks on it again, refresh
		if (this.is_showing()) {
			if (!$(CONTENT.WRAPPER).hasClass('sub')) {
				this.winscroll.toTop();
			}
			var success = this.fetch_cache();
			if(!success) {
				if (!this.tab.hasClass('fetching')) {
					this.tab.addClass('fetching');
					this.fetch_content();
				}
			}
		}
		else if (pokki.isPopupShown()) {
			var success = this.fetch_cache();
			if (!success) {
				//this.spinner.show(true);
				this.fetch_content();
			}
			//this.winscroll.toTop();
			this.winscroll.set(0,0);
		}
		
		$(CONTENT.WRAPPER).removeClass('sub');
		
		// mark active things active...
		this.content.addClass('active');
		// clear badge
		this.clear_badge.delay(250, this);
		// save open tab state
		window.localStorage.setItem(KEYS.ACTIVE_TAB, this.tab.id);
	},
	
	onHide: function() {
		this.tab.removeClass('selected');
		//this.content.removeClass('active');
		//var resDiv = this.get_results_div();
		//if(resDiv) resDiv.hide();
	},
	
	is_showing: function() {
		if (DEBUG && this.tab.hasClass('selected')) console.log('[SHOWING:]', this.tab.getAttribute('id'));
		return this.tab.hasClass('selected');  
	},
	
	// When fired, reads local storage value and updates the badge for this tab
	onBadgeupdate: function() {
		if(this.badge && this.unread_key != '') {
			var count = window.localStorage.getItem(this.unread_key);
			
			if (count > 99)
				count = 99;
							
			this.badge.set('text', count);
			
			if (count > 0) {
				this.badge.show();
				this.badge.tween('opacity', 1);
			} else {
				this.badge.tween('opacity', 0);
			}
		}
	},
	
	clear_badge: function() {
		if(this.badge) {
			this.badge.set('tween', {
				duration: 'short'
			});
			
			this.badge.tween('opacity', 0).get('tween').chain(function() {
				this.badge.empty();
				this.badge.hide();
				// clear local storage value
				window.localStorage.setItem(this.unread_key, 0);
				
				// update main pokki badge count
				pokki.rpc('refresh_badge_count();');
			}.bind(this));
		}
	},
	
	// Fired when popup is re-shown after all splash and initialization is done
	onPopupShown: function() {
		if (DEBUG) console.log('[onPopupShown]', this.tab.id);
		this.clear_badge.delay(250, this);
		GA.trackPageView('/' + this.tab.id);
		this.track_badge_count();
	},
	
	onPopupHidden: function() {
		//this.winscroll.set(0,0);
	},
	
	get_results_div: function() {
		return this.content.getElement('div.results');
	},
	
	add_content: function(c) {
		this.content.empty();
		this.content.grab(c);
	},
	
	reenable_force_fresh: function() {
		this.tab.removeClass('fetching');
	},
	
	onLogout: function() {
		this.from_logout = true;
		$$(this.tabs_selector).removeClass('selected');
		this.content.empty();
	}
});