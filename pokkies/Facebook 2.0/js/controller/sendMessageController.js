/**
 * Facebook Pokki / sendMessageController.js - Controls message sending
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * Note: NOT IN USE.
 * This is a prototype in attempt to simulate a message reply functionality
 * by re-appropriating the Facebook JavaScript SDK Send dialog (original purposed for website usage to send links)
 * We deemed that the approach is not seamless/friendly enough, so we abandoned the approach.
 *
 * @version     2.1.0
 * @license     MIT License
 * @author      Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */

var SendMessageController = new Class({
    Extends: BaseController,
    
    initialize: function(options, recipient) {
        this.parent(options);
        
		var send_url = 'https://www.facebook.com/dialog/send?app_id=' + pokki.getScrambled(FB_APP_ID) + '&to=' + recipient + '&redirect_uri=http://www.pokki.com/facebook/messages/send/success&display=popup';
		
        
        pokki.showWebSheet(send_url,
            540,
            180,
            //loading_callback
            function(url) {
                if(DEBUG) console.log('[WEB SHEET]', url);
                
                // facebook success page
                if(url != login_url && url.contains('https://www.facebook.com/connect/login_success.html')) {
                    if(DEBUG) console.log('[WEB SHEET]', 'Showing success page');
                    
                    //Util.add_splash_message('Connecting to Facebook<span class="dot1">.</span><span class="dot2">.</span><span class="dot3">.</span>');

                    
                    // parse the token
                    var params = Util.parse_url_hash(url);
                    
                    if(params.error) {
                        console.log('oauth error');
                        pokki.closePopup();
                    }
                    else if(params.access_token) {
                        this.set_access_token(params.access_token);
                        this.make_graph_call(
                            'https://graph.facebook.com/me',
                            { access_token: this.get_access_token() },
                            this.callback_login.bind(this)
                        );
                        
                        // Track first connected event
                        if(!window.localStorage.getItem(KEYS.FIRST_CONNECTED)) {
                            GA.trackEvent('User', 'FirstConnected');
                            window.localStorage.setItem(KEYS.FIRST_CONNECTED, true);
                        }
                    }
                    
                    pokki.hideWebSheet();
                    return false;
                }
                else if(url.contains('method=permissions.request')) {
                    if(DEBUG) console.log('[WEB SHEET]', 'Showing permissions page');
                    
                    // extend height of page to show all permissions
                    pokki.setWebSheetSize(CHROME.WIDTH, 650);
                }
                else if(url.contains('facebook.com/checkpoint')) {
                    if(DEBUG) console.log('[WEB SHEET]', 'Showing checkpoint page');
                    
                    pokki.setWebSheetSize(CHROME.WIDTH, CHROME.HEIGHT);
                }
                else if ((url.contains('https://www.facebook.com/dialog/oauth') == false) && 
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
				Util.add_splash_message('<span class="i i-alert2"></span>An error occurred connecting to Facebook<br /><span class="login_try_again uiButton"><span>Please try again</span></span>');
				this.setup_try_again();
				(function() {
					return true;
				}).delay(1);
            }.bind(this)
        );
        
        GA.trackPageView('/login');
    }

});
