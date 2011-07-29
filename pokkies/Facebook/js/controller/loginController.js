/**
 * Facebook Pokki / loginController.js - Controls the login flow
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
 
var LoginController = new Class({
    Extends: BaseController,
    
    initialize: function(options) {
        this.parent(options);
        
        // Update splash message
        Util.add_splash_message('Connecting to Facebook<span class="dot1">.</span><span class="dot2">.</span><span class="dot3">.</span>');
        
        var login_url = 'https://www.facebook.com/login.php?api_key=' + pokki.getScrambled(FB_APP_ID) 
                        + '&skip_api_login=1&display=popup&cancel_url=https%3A%2F%2Fwww.facebook.com%2Fconnect%2F'
                        + 'login_success.html%3Ferror_reason%3Duser_denied%26error%3Daccess_denied%26error_description%3DThe%2Buser%2Bdenied%2Byour%2Brequest.&fbconnect=1'
                        + '&next=https%3A%2F%2Fwww.facebook.com%2Fconnect%2Fuiserver.php%3Fmethod%3Dpermissions.request%26app_id%3D105443409538811%26display%3Dpopup%26'
                        + 'redirect_uri%3Dhttps%253A%252F%252Fwww.facebook.com%252Fconnect%252Flogin_success.html%26response_type%3Dtoken%26fbconnect%3D1%26perms%3Doffline_access'
                        + '%252Cread_stream%252Cpublish_stream%252Cread_mailbox%252Cread_requests%252Cemail%252Cuser_activities%252Cfriends_activities%26from_login%3D1&rcount=1';
        
        pokki.showWebSheet(login_url,
            558,
            415,
            //loading_callback
            function(url) {
                if(DEBUG) console.log('[WEB SHEET]', url);
                
                // facebook success page
                if(url != login_url && url.contains('https://www.facebook.com/connect/login_success.html')) {
                    if(DEBUG) console.log('[WEB SHEET]', 'Showing success page');
                    
                    // Update splash message
                    Util.add_splash_message('Connecting to Facebook<span class="dot1">.</span><span class="dot2">.</span><span class="dot3">.</span>');
                    
                    // Parse the token
                    var params = Util.parse_url_hash(url);
                    
                    if(params.error) {
                        if(DEBUG) console.log('oauth error');
                        pokki.closePopup();
                    }
                    else if(params.access_token) {
                        this.set_access_token(params.access_token);
                        // Get logged in user information
                        this.make_graph_call(
                            'https://graph.facebook.com/me?access_token=' + this.get_access_token(),
                            this.callback_login.bind(this)
                        );
                        
                        // Track first connected event
                        if(!window.localStorage.getItem(KEYS.FIRST_CONNECTED)) {
                            GA.trackEvent('User', 'FirstConnected');
                            window.localStorage.setItem(KEYS.FIRST_CONNECTED, true);
                        }
                    }
                    
                    return false;
                }
                else if(url.contains('method=permissions.request')) {
                    if(DEBUG) console.log('[WEB SHEET]', 'Showing permissions page');
                    
                    // extend height of page to show all permissions
                    pokki.setWebSheetSize(558, 650);
                }
                else if(url.contains('facebook.com/checkpoint')) {
                    if(DEBUG) console.log('[WEB SHEET]', 'Showing checkpoint page');
                    
                    pokki.setWebSheetSize(578, 415);
                }
                else if((url.contains('https://www.facebook.com/dialog/oauth') == false) && 
				           (url.contains('https://www.facebook.com/connect/uiserver.php') == false) && 
						   (url.contains('https://www.facebook.com/login.php') == false)) {
					// Don't display this page, but show it in the user's browser
					pokki.openURLInDefaultBrowser(url);
                    pokki.closePopup();
					return false;
				}
                else {
                    if(DEBUG) console.log('[WEB SHEET]', 'Showing login page');
                }
                
				return true;
            }.bind(this),
            
            function(error) {
                // Update splash message
				Util.add_splash_message('<span class="i i-alert2"></span>An error occurred connecting to Facebook<br /><span class="login_try_again uiButton"><span>Please try again</span></span>');
				// Add events for log in try again
				this.setup_try_again();
				(function() {
					return true;
				}).delay(1);
            }.bind(this)
        );
        
        // Tracking
        GA.trackPageView('/login');
    },
    
    /**
     * Callback for retrieving user information
     */
    callback_login: function(resp) {
        if(! resp.error) {
            _LOGGED_IN = true;
            // Load frame
            Util.transition_splash_out();
            // Store basic FB User info
            this.set_user(resp);
            // Start badge poll
            pokki.rpc('start_badge_poll();');
            // Start permissions poll
            pokki.rpc('start_permissions_poll();');
            // Load and display tab content
            var active_tab = window.localStorage.getItem(KEYS.ACTIVE_TAB);
            active_tab = active_tab ? active_tab : TABS.DEFAULT_TAB;
            $(active_tab).fireEvent('show');
            // Add context menu item to logout
            Util.add_logout_context();
        }
    },
    
    /**
     * Attaches events to create new login screen
     */
    setup_try_again: function() {
        $$('.login_try_again').each(function(el) {
            el.addEvent('click', function() {
                new LoginController();
            }); 
        });
    }
});
