/**
 * Background logic
 *
 * NOTE: If your app has no need for the background page, please remove it from your app and manifest.json settings. 
 * The background page is entirely optional and useful for polling for new content, notifications, etc.
 */
 

    
/**
 * Listener for notification clicks
 */
var onNotificationClicked = function(data, id) {
    console.log('[Event] Notification was clicked:', id, data);
    // Do something - take the user to this story item, etc.
};
pokki.addEventListener('notifyClicked', onNotificationClicked);