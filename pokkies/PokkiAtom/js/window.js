// Global variable for our core app
var Atom = false;

// Add listener for when the window is first loaded
// Perform window page initiation and configuration
// NOTE: DOMContentLoaded is the ideal event to listen for as it doesn't
// wait for external resources (like images) to be loaded
function load() {
	console.log('Window page is loaded.');
	Atom = new App();
}
window.addEventListener('DOMContentLoaded', load, false);

// Add listener for when the page is unloaded by the platform 
// This occurs due to inactivity or memory usage
// You have 4 seconds from this event to save/store any data
function unload() {
    console.log('App is being unloaded.');
	// Time to save any state
	if (Atom) {
		Atom.onUnload();
	}
}
pokki.addEventListener('unload', unload);

// Add listener for when the app is showing
function showing() {
    console.log('App is almost visible.');    
    if (Atom){
    	Atom.onShowing();
    }
}
pokki.addEventListener('showing', showing);

// Add listener for when the app is shown
function shown() {
    console.log('App is visible.');
    if (Atom) {
    	Atom.onShown();
    }
}
pokki.addEventListener('shown', shown);

// Add listener for when the app is hidden
function hidden() {
    console.log('App was hidden.');
    if (Atom) {
    	Atom.onHidden();
    }
}
pokki.addEventListener('hidden', hidden);