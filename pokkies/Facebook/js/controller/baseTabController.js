/**
 * Facebook Pokki / baseTabController.js
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
        this.content = $(content);
        this.tabs_selector = tabs_selector;
        this.badge = $(tab).getElement('.badge');
        this.unread_key = unread_key;
        
        // setup tab events
        this.tab.addEvent('click', this.show.bind(this));
        this.tab.addEvent('show', this.onShow.bind(this));
        this.tab.addEvent('hide', this.onHide.bind(this));
        this.tab.addEvent('popup_shown', this.onPopupShown.bind(this));
        this.tab.addEvent('popup_hidden', this.onPopupHidden.bind(this));
        this.tab.addEvent('logout', this.onLogout.bind(this));
        
        // setup badges
        this.addEvent('badgeupdate', this.onBadgeupdate.bind(this));
        this.fireEvent('badgeupdate');
        
        // setup loading image
        this.spinner = new Spinner(this.content);
        
        // setup scroll
        this.winscroll = new Fx.Scroll(this.content);
 
        // display tab
        if(show)
            window.localStorage.setItem(KEYS.ACTIVE_TAB, this.tab.id);
    },
    
    /**
     * Populates from cache
     * Classes that extend from this need to implement fetch_cache
     * @param Boolean   no_transition     Whether to skip the transition or not
     */
    fetch_cache: function(no_transition) { return false; },
    
    /**
     * Populates from Ajax call
     * Classes that extend from this need to implement fetch_content
     */
    fetch_content: function() { return false; },
    
    /**
     * Tab click event
     */
    show: function() {        
        if(this.is_showing())
            this.winscroll.toTop();
            
        $$(this.tabs_selector).each(function(tab) {
            if(tab != this.tab) {
                tab.fireEvent('hide');
            }
        }.bind(this));
        
        if(PERM_Controller) {
            PERM_Controller.hide();
        }
        
        this.tab.fireEvent('show');
    },
    
    /**
     * Tab onShow event
     */
    onShow: function() {
        // Tracking
        GA.trackPageView('/' + this.tab.id);
        
        // If tab is already visible and user clicks on it again, refresh
        if(this.is_showing()) {
            if(!this.tab.hasClass('fetching')) {
                this.tab.addClass('fetching');
                this.fetch_content();
            }
        }
        else if(pokki.isPopupShown()) {
            var success = this.fetch_cache();
            if(!success) {
                this.spinner.show(true);
                this.fetch_content();
            }
        }
        
        // mark active things active...
        this.tab.addClass('active');
        this.content.addClass('active');
        // clear badge
        this.clear_badge.delay(200, this);
        // save open tab state
        window.localStorage.setItem(KEYS.ACTIVE_TAB, this.tab.id);
    },
    
    /**
     * Tab onHide event
     */
    onHide: function() {
        this.tab.removeClass('active');
        this.content.removeClass('active');
        var resDiv = this.get_results_div();
        if(resDiv) resDiv.hide();
    },
    
    /**
     * Returns whether or not this tab is currently being shown
     */
    is_showing: function() {
        return this.tab.hasClass('active');  
    },
    
    /**
     * When fired, reads local storage value and updates the badge for this tab
     * (not to be confused with the badge on the pokki icon)
     */
    onBadgeupdate: function() {
        if(this.badge && this.unread_key != '') {
            var count = window.localStorage.getItem(this.unread_key);
            if(count > 99)
                count = 99;
                
            this.badge.set('text', count);
            
            if(count > 0) {
                this.badge.show();
                this.badge.tween('opacity', 1);
            }
            else {
                this.badge.tween('opacity', 0);
            }
        }
    },
    
    /**
     * Clear the badge for this tab
     * (not to be confused with the badge on the pokki icon)
     */
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
    
    /**
     * Fired when popup is re-shown after all splash and initialization is done
     */
    onPopupShown: function() {
        // Clear badge for this tab
        this.clear_badge.delay(250, this);
        // Tracking
        GA.trackPageView('/' + this.tab.id);
    },
    
    /**
     * Fired when popup is hidden
     */
    onPopupHidden: function() {
        // no default action
    },
    
    /**
     * Get the results div for this particular tab
     */
    get_results_div: function() {
        return this.content.getElement('div.results');
    },
    
    /**
     * Add content to div for this particular tab
     */
    add_content: function(c) {
        this.content.grab(c);
    },
    
    /**
     * 'fetching' class was added to prevent hyper-clickers...
     * removes class and re-enables the force refresh
     */
    reenable_force_fresh: function() {
        this.tab.removeClass('fetching');
    },
    
    /**
     * Log out action for popup hides and deactivates all tabs
     */
    onLogout: function() {
        this.from_logout = true;
        $$(this.tabs_selector).hide();
        $$(this.tabs_selector).removeClass('active');
        this.content.empty();
    }
});