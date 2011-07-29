/**
 * Facebook Pokki / notificationsView.js
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * Note: needs to be updated to use LocalStore class for consistency
 *
 * @version     1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */
 
var NotificationsView = new Class({
    Extends: BaseView,
    
    /**
     * Initialization (see BaseView class)
     */
    initialize: function(data, controller, no_transition) {
        this.parent(data, controller, no_transition);
        
        if(DEBUG) {
            console.log('[NOTIFICATIONS DATA]', data);
        }
    },
    
    /**
     * Merge data into template and display
     * @param no_transition Boolean Whether or not to skip transition
     */
    populate_template: function(no_transition) {
        var template = $('notifications_template').innerHTML;
        var notifItem = '';
        var unread_ids = [];
        
        // setup new container
        var new_results = new Element('div', {class: 'results'});
        var ul = new Element('ul', {
            class: 'ntList' + (no_transition ? ' no_animate' : ' animate')
        });
        
        if(this.data.length > 0) {
            // timer for animation
            var duration = 200;
            
            for(var i = 0; i < this.data.length; i++) {
                if(duration > 1200)
                    duration = 200;
                else
                    duration = duration + 140;
                
                // add unread notification ids to array
                if(this.data[i].is_unread) {
                    this.controller.add_unread_id(this.data[i].notification_id);
                }
                
                // don't display notifications from people the user has elected to hide
                if(this.data[i].is_hidden)
                    continue;
                
                data = {};
                data.user_id = this.data[i].sender_id;
                data.id = this.data[i].notification_id;
                data.title_html = this.data[i].title_html;
                data.title_text = this.data[i].title_text;
                data.href = this.data[i].href;
                data.icon = this.data[i].icon_url ? '<img src="' + this.data[i].icon_url + '" />' : '';
                data.user_image = 'http://graph.facebook.com/' + this.data[i].sender_id + '/picture';
                
                if(!data.title_html && !data.title_text) {
                    // for some reason facebook has empty, null notifications that come through sometimes
                    continue;
                }
                
                // convert epoch to timestamp
                var today = new Date();
                var this_date = new Date(new Date().parse(this.data[i].updated_time * 1000).toGMTString()); 
                // Context
                if(86400000 > today - this_date) {
                    // happened in past day
                    data.date = this_date.timeDiffInWords();
                }
                else if(31536000000 > today - this_date) {
                    // happened in past year
                    data.date = this_date.format('%B %e at <span class="time">%X</span>');
                }
                else {
                    // very old, show year
                    data.date = this_date.format('%B %e, %Y');
                }
                
                // Apply the template
                notifItem = template.substitute(data);
                
                if(no_transition) {
                    var styles = {};
                }
                else {
                    var styles = {
                        '-webkit-animation-duration': duration + 'ms'
                    };
                }
                
                // Add to list
                ul.grab(new Element('li', {
                        html: notifItem,
                        id: 'nt_' + this.data[i].notification_id,
                        class: 'clearfix ' + (this.data[i].is_unread ? 'unread' : 'read'),
                        click_to: this.data[i].href,
                        styles: styles,
                        events: {
                            click: function() {
                                this.removeClass('unread');
                                GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/external');
                                pokki.openURLInDefaultBrowser(this.getProperty('click_to'));
                                pokki.closePopup();
                            }
                        }
                    })
                );   
            }
            
            // Create view more link
            var div = new Element('div', {
                id: MORE.NOTIFICATIONS,
                class: 'paging-more',
                html: '<strong>See All Notifications</strong>',
                events: {
                    click: function() {
                        GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/external');
                        pokki.openURLInDefaultBrowser('http://www.facebook.com/notifications.php');
                        pokki.closePopup();
                    }.bind(this)
                }
            });
            
            new_results.grab(ul);
            new_results.grab(div);
        }
        else {
            // No new notifications messaging
            var div = new Element('div', {
                class: 'no-items notifications',    
                html: '<img src="img/no-notifications.png" />' +
                    'You have no notifications.'
            });
            
            new_results.grab(div);
        }
            
        this.controller.add_content(new_results);
        
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
        
        ul = null;
        div = null;
        new_results = null;
    }
});