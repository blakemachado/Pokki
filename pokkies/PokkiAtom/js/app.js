var App = (function() {
    
    var self = this;
    
    
    /**
     * Listener for when the window is about to be shown
     */
    var onShowing = function() {    
        console.log('[Event] App is almost visible.');
        // Do something
    };
    
    /**
     * Listener for when the window is shown
     */
    var onShown = function() {
        console.log('[Event] App is visible.');
        // Your logic to be executed when the pokki is shown.
         
         
        ///////////////////////////////////////////
        // We're displaying a splash on first run as an example.        
        var splash_ran = new LocalStore('splash_ran');
        
        // splash elements
        var splash = document.getElementById('splash');
        var atom = document.getElementById('atom');
        var wrapper = document.getElementById('wrapper');
        
        // animate splash on first run
        if(!splash_ran.get()) {
            splash.classList.add('animate');
            atom.classList.add('animate');
            wrapper.classList.remove('show');
            
            // allows the css animation to run for some time before removing the animation class
            setTimeout(function() {
                splash.classList.remove('animate');
                atom.classList.remove('animate');
                wrapper.classList.add('show');
                
                // stagger content animation
                var p = wrapper.getElementsByTagName('p');
                for(var i = 0; i < p.length; i++) {
                    p[i].style['-webkit-animation-duration'] = (100 * i + 300) + 'ms, 300ms';
                    p[i].style['-webkit-animation-delay'] = '0ms,'+ (100 * i + 300) + 'ms';
                }
            }, 2200);
            
            splash_ran.set(true);
        }
        else {
            splash.classList.remove('animate');
            atom.classList.remove('animate');
            wrapper.classList.add('show');
        }
    };
    
    /**
     * Listener for when the window is about to be minimized
     */
    var onHiding = function() {
        console.log('[Event] App is about to be hidden.');
        // Do something
    };
    
    /**
     * Listener for when the window is minimized
     */
    var onHidden = function() {
        console.log('[Event] App was hidden.');
        // Do something, save state, etc.
    };
    
    /**
     * Listener for when the page is unloaded via a relaunch/reload
     */
    var onUnload = function() {
        console.log('[Event] App is being unloaded in 4 seconds.');
        // Do something, save state, etc.
        pokki.saveWindowState('main'); // save the position of the current window
    };
    
    /**
     * Listener for when the user requests to enter/exit fullscreen
     */
    var onFullscreen = function() {
        console.log('[Event] App is ' + (document.webkitIsFullScreen ? 'exiting fullscreen' : 'entering fullscreen') + '.');
        
        if (document.webkitIsFullScreen) {
            // Already in fullscreen, user wants to exit
            document.webkitCancelFullScreen();
        }
        else {
            // Not currently in fullscreen, user wants to enter fullscreen
            document.body.webkitRequestFullScreen();
        }
    };
    
    /**
     * Listener for context menu clicks
     */
    var onContextMenu = function(id) {
        console.log('[Event] Context menu item clicked:', id);
        
        ///////////////////////////////////////////
        // Map your context menu items to their specific actions
        switch(id) {
            case 'item1':
                // Do something
                break;
            case 'item2':
                // Do something
                break;
        }
    };
    
    
    
    /**
     * Initialize whatever needs to be initialized
     */
    var init = function() {
        ///////////////////////////////////////////
        // Initialize classes, objects, event delegation, etc.
        pokki.loadWindowState('main'); // restore window position
        
        
        // Example to illustrate the badge icons
        document.getElementById('badge_icon').onclick = function() {
            // Set it to some random number
            pokki.setIconBadge(Math.round(Math.random(0,10)*10));
            return false;
        };
        
        document.getElementById('badge_clear').onclick = function() {
            // Reset the badge
            pokki.removeIconBadge();
            return false;    
        };
        
        // Example to illustrate notifications
        document.getElementById('notification_ex').onclick = function() {
            
            // Note: Use this in conjunction with the 'notifyClicked' event to handle clicks on notification messages
            // The event listener for 'notifyClicked' must reside in the background page (see background.js for the usage)
            pokki.notify({
                title: 'Your title',
                subtitle: 'Optional subtitle',
                text: 'This text is optional as well.',
                data: { // optional, store data here that you can later retrieve from a notifyClicked event
                    mydata: 'Arbitrary data 1'
                },
                iconPath: '' // optional, specify an absolute icon path otherwise your app icon is used instead
            });
            
            pokki.notify({
                title: 'Also...',
                text: 'Make sure you check out the notification center, too!',
                data: { // optional, store data here that you can later retrieve from a notifyClicked event
                    mydata: 'Arbitrary data 2'
                },
                iconPath: '' // optional, specify an absolute icon path otherwise your app icon is used instead
            });
            
            return false;
        };
        
        
        ///////////////////////////////////////////
        // Enable optional pokki features
        pokki.allowResize(false, true, { // allows resizing vertically
            minHeight: 300
        }); 
        
        // Optional: Allow fullscreen
        pokki.setWindowFeature('fullscreen', true);
        
        // Optional: Context menu items
        pokki.addContextMenuItem('Item 1', 'item1');
        pokki.addContextMenuItem('Item 2', 'item2');
        
        
        ///////////////////////////////////////////
        // Add optional pokki platform event listeners
        pokki.addEventListener('showing', onShowing);
        pokki.addEventListener('shown', onShown);
        pokki.addEventListener('hiding', onHiding);
        pokki.addEventListener('hidden', onHidden);
        pokki.addEventListener('unload', onUnload);
        pokki.addEventListener('fullscreen', onFullscreen);
        pokki.addEventListener('context_menu', onContextMenu);
    };
    
    
    /**
     * Publically accessible methods
     */
    return {
        init: init
    };
})();