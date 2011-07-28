var Molecule = false;

// Add listener for when the page is unloaded
// You have 4 seconds from hearing this event to 
// the pop-up page being disposed
pokki.addEventListener('popup_unload', onUnload);

function onUnload() {
    console.log('Pop-up page is being unloaded.');
	
	// Time to save any state
	if(Molecule) Molecule.onPopupUnload();
}

// Add listener for when the DOM is loaded
window.addEventListener('DOMContentLoaded', onLoad, false);

function onLoad() {
	console.log('Pop-up page is loaded.');
	
	// Perform pop-up page initiation and configuration
	// Time to restore any state
	Molecule = new App();
	
	//GOOGLE ANALYTICS: Enter your settings here
    ga_pokki._setAccount('UA-22567862-1');
    ga_pokki._setDomain('googleanalytics.pokki.com');
}

// Add listener for when the pop-up window is showing
pokki.addEventListener('popup_showing', onShowing);

function onShowing() {
    console.log('Pop-up window is almost visible.');
    
    if(Molecule) Molecule.onPopupShowing();
}

// Add listener for when the pop-up window is shown
pokki.addEventListener('popup_shown', onShow);

function onShow() {
    console.log('Pop-up window is visible.');
    
    if(Molecule) Molecule.onPopupShown();
}

// Add listener for when the pop-up window is hidden
pokki.addEventListener('popup_hidden', onHide);

function onHide() {
    console.log('Pop-up window was closed.');
    
    if(Molecule) Molecule.onPopupHidden();
}

// RPC calls
function update_feed() {
    if(Molecule && !pokki.isPopupShown()) Molecule.reload_feed();
}