/**
 * Facebook Pokki / friendRequestsView.js
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */

var FriendRequestsView = new Class({
    Extends: BaseView,
    
    /**
     * Initialization (see BaseView class)
     */
    initialize: function(data, controller, no_transition) {
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
        var new_results = new Element('div', {class: 'results'});
        var template = $('friendrequests_template').innerHTML;
        var frItem = '';
         
        // setup new container
        var ul = new Element('ul', {
            class: 'frList' + (no_transition ? ' no_animate' : ' animate')
        });
        
        if(this.data.length > 0) {
            // timer for animation
            var duration = 200;
 
            for(var i = 0; i < this.data.length; i++) {
                if(duration > 1000)
                    duration = 200;
                else
                    duration = duration + 140;
                
                data = {};
                data.user_id = this.data[i].uid;
                data.user_name = this.data[i].name;
                data.user_image = 'http://graph.facebook.com/' + this.data[i].uid + '/picture';
                               
                // Apply the template
                frItem = template.substitute(data);
                
                if(no_transition) {
                    var styles = {};
                }
                else {
                    var styles = {
                        '-webkit-animation-duration': duration + 'ms'
                    };
                }
                
                var li = new Element('li', {
                    html: frItem,
                    id: 'fr_' + this.data[i].uid,
                    class: 'clearfix',
                    styles: styles
                });
                
                // Add to list
                ul.grab(li);
                
            } //// END data loop

            new_results.grab(ul);
        }
        // No new friend requests
        else {
            var div = new Element('div', {
                class: 'no-items friend_requests',    
                html: '<img src="img/no-requests.png" />' +
                    'No friend requests.<br />' +
                    '<strong><a href="https://www.facebook.com/home.php?sk=ff">Search for a friend</a></strong>'
            });
            
            new_results.grab(div);
        }
        
        if(this.controller.is_showing()) {
            var lazyloader = new LazyLoad({
                image: LAZYLOAD_IMAGE,
                container: new_results,
                resetDimensions: false,
                onLoad: function(img) {
                    //set opacity to 0, fade it in!
                    img.setStyle('opacity',0).fade(1);
                }
            });
        }
        
        this.controller.add_content(new_results);
        
        ul = null;
        div = null;
        new_results = null;
    }
});