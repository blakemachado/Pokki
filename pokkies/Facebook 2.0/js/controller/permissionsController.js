/**
 * Facebook Pokki / permissionsController.js - Controls the Permissions Overlay
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

var PermissionsController = new Class({
    Extends: BaseController,
    
    Binds: ['launchWebsheet', 'cancelOverlay'],
    
    /**
     * Initialization
     * @param content   The parent DIV
     */
    initialize: function() {
        this.parent();
        this.content = $(CONTENT.PERMISSIONS);       
        //this.createOverlay();
        this.launchWebsheet();        
        GA.trackEvent('Error', 'PermissionsChanged');
    },
    
    /**
     * Creates and displays the overlay
     */
    createOverlay: function() {
        this.overlay = new Element('div', {
            class: 'permissions_overlay'
        });
        
        this.overlay.grab(new Element('div', {
            html:   '<strong><span class="i i-alert"></span>Oops, we don\'t have permission to do that!</strong>' +
                    '<p>To use this app as intended you need to update your permissions so it can<br />access your feed, messages, notifications and friend requests.</p>'
        }));
        
        this.overlay.grab(new Element('span', {
            class: 'uiButton uiButtonConfirm',
            html: '<span>Update Permissions</span>',
            events: {
                click: this.launchWebsheet
            }
        }));
        
        var text = new Element('span', {
            class: 'cancel_text',
            text: ' or '
        });
        
        text.grab(new Element('span', {
            class: 'a-link',
            html: 'Fix this later',
            events: {
                click: this.cancelOverlay
            }
        }));
        
        this.content.grab(this.overlay);
        this.main.removeClass('switch');
    },
    
    /**
     * Displays Facebook permissions dialog
     */
    launchWebsheet: function() {
        var perm_url = 'https://www.facebook.com/dialog/oauth?client_id=' + pokki.getScrambled(FB_APP_ID) + '&display=popup&redirect_uri=https://www.facebook.com/connect/login_success.html&response_type=token&scope=offline_access,read_stream,publish_stream,read_mailbox,read_requests,email,user_activities,user_events,rsvp_event,friends_activities,manage_notifications,manage_friendlists';
        pokki.showWebSheet(perm_url,
            640,
            CHROME.HEIGHT,
            function(url) {
                console.log(url);
                
                // facebook success page
                if(perm_url != url && url.contains('https://www.facebook.com/connect/login_success.html')) {
                                                        
                    // parse the token
                    var params = Util.parse_url_hash(url);
                    if (params.error) {
                        console.log('oauth error');
                        pokki.closePopup();
                    }
                    else if (params.access_token) {
                        this.set_access_token(params.access_token);
                                                
                        // mark screen as shown
                        var permissions = JSON.decode(window.localStorage.getItem(KEYS.PERMISSIONS));
                        if (permissions) permissions.shown = true;
                        window.localStorage.setItem(KEYS.PERMISSIONS, JSON.encode(permissions));
                        
                        // Track first connected event
                        if(!window.localStorage.getItem(KEYS.FIRST_CONNECTED)) {
                            GA.trackEvent('User', 'FirstConnected');
                            window.localStorage.setItem(KEYS.FIRST_CONNECTED, true);
                        }
                    }
                    
                    
                    this.hide();
                    return false;
                }
                
                return true;
            }.bind(this),
            
            function(error) {
                //console.log(arguments);
            }
        );
    },
    
    /**
     * User elects not to grant permissions
     */
    cancelOverlay: function() {
        var permissions = JSON.decode(window.localStorage.getItem(KEYS.PERMISSIONS));
        if(permissions) {
            permissions.timeout = 1000 * 60 * 60 * 24 * 7; // one week
        }
        else {
            permissions = {timeout: 1000 * 60 * 60 * 24 * 7}; // one week
        }
        
        // mark screen as shown
        permissions.shown = true;
        window.localStorage.setItem(KEYS.PERMISSIONS, JSON.encode(permissions));
        
        this.hide();
        
        // stop polling
        pokki.rpc('stop_permissions_poll();');
        // start again with new timeout
        pokki.rpc('start_permissions_poll();');
    },
    
    hide: function() {
    	/*
    	this.main.addClass('switch');
    	this.overlay.set('tween', {duration: '200ms'});
	    this.overlay.tween('opacity', 0).get('tween').chain(function() {
            this.overlay.destroy();
        }.bind(this));
        // $$('#tabs li').show();
        */
    }
});