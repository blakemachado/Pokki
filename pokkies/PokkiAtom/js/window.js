// Add listener for when the window is first loaded
// Perform window page initiation and configuration
// NOTE: DOMContentLoaded is the ideal event to listen for as it doesn't
// wait for external resources (like images) to be loaded
function load() {
	console.log('[DOM Event] Window page is loaded.');
	// Initialize app
	App.init();
}
window.addEventListener('DOMContentLoaded', load, false);
