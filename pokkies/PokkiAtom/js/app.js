var App = function() {
    var unloaded = new LocalStore('unloaded');
    var splash_ran = unloaded.get() ? true : false;

    // attach click event to minimize button
    var minimize = document.getElementById('minimize');
    minimize.addEventListener('click', pokki.closePopup);
    
    // Initialize whatever else needs to be initialized
    
    
    
        
    // Kick off what needs to be done whenever the popup is about to be shown
    this.onPopupShowing = function() {    
    
    };
    
    // Kick off what needs to be done when the popup is shown
    this.onPopupShown = function() {
        // splash elements
        var splash = document.getElementById('splash');
        var atom = document.getElementById('atom');
        var wrapper = document.getElementById('wrapper');
        
        // animate splash on first run
        if(!splash_ran) {
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
            
            splash_ran = true;
        }
        else if(unloaded.get()) {
            splash.classList.remove('animate');
            atom.classList.remove('animate');
            wrapper.classList.add('show');
        }
        unloaded.remove();
    };
    
    // Kick off what needs to be done when the popup is hidden
    this.onPopupHidden = function() {
    
    };
    
    // Use this to store anything needed to restore state when the user opens the Pokki again
    this.onPopupUnload = function() {
        unloaded.set(true);
    };
};