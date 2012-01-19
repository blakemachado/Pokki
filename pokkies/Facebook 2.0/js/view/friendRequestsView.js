/**
 * Facebook Pokki / friendRequestsView.js
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     2.1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * 				Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */
var FriendRequestsView = new Class({
    Extends: BaseView,
   
    /**
     * Initialization (see BaseView class)
     */
    initialize: function(data, controller, no_transition) {
    
        
        this.main = $(MAIN.FRIEND_REQUESTS);
        this.content_id = CONTENT.FRIEND_REQUESTS;
        this.content = $(this.content_id);
        
        this.parent(data, controller, no_transition);

        if(DEBUG) {
            console.log('[FRIEND REQUESTS DATA]', data);
        }
    },
    
	/**
	 * Merge data into template and display
	 * @param no_transition Boolean Whether or not to skip transition
	 */   
    populate_template: function(no_transition) {
     	this.content.empty();
        var template = $('friendrequests_template').innerHTML;
        var frItem = '';
         
        // setup new container
        var new_results = new Element('div', {class: 'results'});
        var ul = new Element('ul', {
            class: 'frList'// + (no_transition ? ' no_animate' : ' animate')
        });
		
		if (DEBUG) console.log('[FRIEND REQUESTS]', 'Populating Pane');  
     
        
        if(this.data.length > 0) {
 
            for(var i = 0; i < this.data.length; i++) {
                
                data = {};
                data.user_id = this.data[i].uid;
                data.user_name = this.data[i].name;
                data.user_image = 'http://graph.facebook.com/' + this.data[i].uid + '/picture';
                               
                // Apply the template
                frItem = template.substitute(data);
                
                var li = new Element('li', {
                    html: frItem,
                    id: 'fr_' + this.data[i].uid,
                    class: 'clearfix'
                });
                
                // Add to list
                ul.grab(li);
                
            } //// END data loop


            // Create view more link
            var div = new Element('div', {
                id: MORE.FRIEND_REQUESTS,
                class: 'paging-more',
                html: '<strong>See All My Friends</strong>',
                events: {
                    click: function() {
                        GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/external');
                        pokki.openURLInDefaultBrowser('http://www.facebook.com/friends');
                        pokki.closePopup();
                    }.bind(this)
                }
            });
        
            new_results.grab(ul);
            new_results.grab(div);            
        }
        // No new friend requests
        else {
            var div = new Element('div', {
                class: 'no-items friend_requests',    
                html: '<img src="img/no-requests.png" />' +
                    'No friend requests<br />' +
                    '<strong><a href="https://www.facebook.com/home.php?sk=ff">Search for a friend</a></strong>'
            });
            
            new_results.grab(div);
        }        
        
        this.controller.add_content(new_results);
        
        ul = null;
        div = null;
        new_results = null;
        
        //this.parent();
    }
});