/**
 * PokkiBrowser - Utility for mimicking Pokki SDK functions for browser-based Pokki development
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     1.3, last updated: 11/15/2011
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 *
 * Usage: Include in popup.html and background.html and that's it!
 * It's JavaScript framework independent
 */
 
try {
	// simply a test to see if pokki exists
	if(pokki.isPopupShown()) {
		// noop
	}
}
catch(e) {
	pokki = {
		/**
		 * Stores the events in an array
		 */
		addEventListener: function(event_name, func) {
			this.events = this.events ? this.events : {};
			if(!this.events[event_name])
                this.events[event_name] = [];
                
			this.events[event_name].push(func);	
		},
		/**
		 * NOOP
		 */
		openPopup: function() {},
		/**
		 * NOOP
		 */
		closePopup: function() {},
		/**
		 * NOOP
		 */
		setPopupClientSize: function(width, height) {},
		/**
		 * Always returns true since the open browser window is the popup
		 */
		isPopupShown: function() { return true; },
		/**
		 * Launches new browser window
		 */
		openURLInDefaultBrowser: function(url) { window.open(url); },
		/**
		 * Places a badge notifier in top left corner of browser
		 */
		setIconBadge: function(num) {
			if(!this.badge) {
				this.badge = document.createElement('div');
				this.badge.style.position = 'absolute';
				this.badge.style.top = '10px';
				this.badge.style.left = '10px';
				this.badge.style.backgroundColor = '#000000';
				this.badge.style.color = '#ffffff';
				this.badge.style.opacity = 0;
				this.badge.style.height = '14px';
				this.badge.style.width = '14px';
				this.badge.style.padding = '3px';
				this.badge.style.lineHeight = '10px';
				this.badge.style.border = '2px solid #ffffff';
				this.badge.style.textAlign = 'center';
				this.badge.style.font = 'normal 11px "lucida grande"';
				this.badge.style.borderRadius = '14px';
				this.badge.style.boxShadow = '1px 1px 3px #333';
				this.badge.style['-webkit-transition'] = 'all 250ms ease-in';
				
				if(pokki.is_popup)
					document.body.appendChild(this.badge);
				else
					parent.document.body.appendChild(this.badge);
			}
			if(num > 99) num = 99;
			this.badge.innerHTML = num;
			this.badge.style.opacity = 1;
		},
		/**
		 * Hides the badge notifier
		 */
		removeIconBadge: function() {
			if(this.badge) this.badge.style.opacity = 0;
		},
		/**
		 * Talks to the iframe that was created and hidden on the page or
		 * passes the message along to the main window
		 */
		rpc: function(method) {
			if(pokki.is_popup) {
				// talk to background
				eval('pokki.backgroundWin.contentWindow.window.' + method);
			}
			else {
				// talk to popup
				eval('parent.' + method);
			}
		},
		/**
		 * RPC helper that takes an arbitrary number of arguments, the first of which is the function name as a string.
		 * Subsequent arguments are then fed into that function call
		 */
		rpcArgs: function () { 
            var args = Array.prototype.slice.call(arguments); 
            var func = args.shift(); 
            var arg_strings = []; 
            for(var i = 0; i < args.length; i++) { 
                arg_strings.push(JSON.stringify(args[i])); 
            } 
            var rpc_str = func + '(' + arg_strings.join(',') + ')'; 
            return pokki.rpc(rpc_str); 
        },
		/**
		 * Launches a popup window as the websheet, does not support
		 * error_callback
		 */
		showWebSheet: function(url, width, height, loading_callback, error_callback) {
			this.window = window.open(url, '_blank', 'height=' + height + ',width=' + width);
			
			// Handle loading_callback
			var websheet_url = url;
			var w = this.window;
			var that = this;
			this.interval = setInterval(
				function() {
					if(w.location.href && websheet_url != w.location.href && w.location.href != 'about:blank') {
						websheet_url = w.location.href;
						if(loading_callback) {
							var ret = loading_callback(websheet_url);
							
							if(!ret) {
								that.hideWebSheet();
							}
						}
					}
				},
				100
			);
			
			// Error callback
			// unsupported
		},
		/**
		 * Closes the popup window
		 */
		hideWebSheet: function() {
			if(this.window) {
				this.window.close();
				this.window = false;
				clearInterval(this.interval);
			}
		},
		/**
		 * Resizes the popup window
		 */
		setWebSheetSize: function(width, height) {
			if(this.window) {
				this.window.resizeTo(width, height);
			}
		},
		/**
		 * NOOP
		 */
		clearWebSheetCookies: function() {},
		/**
		 * Reads the manifest.json data and returns the value for the key
		 */
		getScrambled: function(key) {
			var mf = pokki.getManifestData();
			if(mf) {
				var sd = mf.scrambled_data;
				for(var i = 0; i < sd.length; i++) {
					if(sd[i].key == key)
						return sd[i].value;
				}
			}
			return '';
		},
		/**
		 * Gets the manifest data
		 * Thanks Marc Nijdam <marc@imadjine.com>
		 */
        getManifestData: function() {
            if (pokki.manifestData) return pokki.manifestData;
            var myJSONP = new XMLHttpRequest();
            myJSONP.open("GET",'manifest.json',false);
            myJSONP.send();
            pokki.manifestData = JSON.parse(myJSONP.responseText);
            return pokki.manifestData;
        },
		/**
		 * Returns the data back as-is
		 */
		scramble: function(data) { return data; },
		/**
		 * Returns the data back as-is
		 */
		descramble: function(scrambled_data) { return scrambled_data; },
		/**
		 * Adds a div in the browser to show status of context menu
		 */
		addContextMenuItem: function(text, id) {
			if(!this.context_menu) {
				this.context_menu = document.createElement('ul');
				this.context_menu.style.position = 'absolute';
				this.context_menu.style.top = '10px';
				this.context_menu.style.listStyle = 'none';
				this.context_menu.style.right = '10px';
				this.context_menu.style.backgroundColor = '#ffffff';
				this.context_menu.style.color = '#333';
				this.context_menu.style.opacity = 0;
				this.context_menu.style.border = '1px solid #d7d7d7';
				this.context_menu.style.textAlign = 'left';
				this.context_menu.style.font = 'normal 11px "lucida grande"';
				this.context_menu.style.borderRadius = '3px';
				this.context_menu.style.boxShadow = 'rgba(0,0,0,0.4) 0px 1px 2px';
				this.context_menu.style['-webkit-transition'] = 'all 250ms ease-in';
				
				if(pokki.is_popup) {
					document.body.appendChild(this.context_menu);
				}
				else {
					parent.document.body.appendChild(this.context_menu);
				}
			}
			
			// Create the item
			var item = document.createElement('li');
			item.style.padding = '5px';
			item.style.cursor = 'pointer';
			if(this.context_menu.innerHTML != '') item.style.borderTop = '1px solid #d7d7d7';
			item.innerHTML = text;
			item.addEventListener('click', function() {
                if(pokki.events && pokki.events.context_menu) {
                    for(var ps = 0; ps < pokki.events.context_menu.length; ps++) {
                        pokki.events.context_menu[ps](id);
				    }
				}
				
				if(!pokki.is_popup) {
					if(parent.pokki.events && parent.pokki.events.context_menu) {
						for(var ps = 0; ps < parent.pokki.events.context_menu.length; ps++) {
                            parent.pokki.events.context_menu[ps](id);
    				    }
					}
				}
			});
			
			this.context_menu.appendChild(item);
			this.context_menu.style.opacity = 1;
		},
		/**
		 * Clears the div that was added to show status of menu
		 */
		resetContextMenu: function() {
			if(this.context_menu) {
				this.context_menu.innerHTML = '';
				this.context_menu.style.opacity = 0;
			}
		},
		
		/**
		 * NOOP
		 */
		setIdleDetect: function(on) { },
		
		/**
		 * Returns inner size
		 */
		getWorkAreaSize: function() {
            var size = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            return size;		  
		}
	};
	
	/**
	 * Additional tinkering to make this all work
	 */
	
	// Whether or not this is the background.html page or not
	pokki.is_popup = location.href.search('background.html') > 0 ? false : true;
	
	if(pokki.is_popup) {
		// create a hidden iframe on the page to mimic the background.html
		// functionality so they can communicate with each other
		pokki.backgroundWin = document.createElement('iframe');
		pokki.backgroundWin.src = 'background.html';
		pokki.backgroundWin.name = 'background';
		pokki.backgroundWin.width = 1;
		pokki.backgroundWin.height = 1;
		pokki.backgroundWin.style.background = 'transparent';
		pokki.backgroundWin.style.visibility = 'hidden';
		
		
		pokki.backgroundWin.addEventListener('load', function() {
			// we do this to ensure that the background page loads before anything
			// needs to be executed on popup_showing() or popup_shown()
			if(pokki.events) {
				if(pokki.events.popup_showing) {
				    for(var ps = 0; ps < pokki.events.popup_showing.length; ps++) {
                        pokki.events.popup_showing[ps]();
				    }
				}
				if(pokki.events.popup_shown) {
					setTimeout(function() {
    				    for(var ps = 0; ps < pokki.events.popup_shown.length; ps++) {
                            pokki.events.popup_shown[ps]();
    				    }
				    }, 1000);
				}
			}
		}, false);
		
		window.addEventListener('DOMContentLoaded', function() {
			document.body.appendChild(pokki.backgroundWin);
		}, false);
		
		// attach event listeners for resizing of workarea
		window.addEventListener('resize', function() {
            if(pokki.events) {
                if(pokki.events.work_area_change) {
				    for(var wac = 0; wac < pokki.events.work_area_change.length; wac++) {
                        pokki.events.work_area_change[wac]();
				    }
                }
            }		  
		})
	}
	
	window.addEventListener('DOMContentLoaded', function() {
		pokki.getManifestData();
	}, false);
}