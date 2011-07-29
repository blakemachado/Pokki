/**
 * Facebook Pokki / messagesView.js
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
 
var MessagesView = new Class({
    Extends: BaseView,
    
    /**
     * Initialization (see BaseView class)
     */
    initialize: function(data, controller, no_transition) {
        this.unread = window.localStorage.getItem(KEYS.UNREAD_MESSAGE_IDS);
        if(!this.unread) {
            this.unread = [];
        }
        else {
            this.unread = JSON.decode(this.unread);
        }
        
        this.parent(data, controller, no_transition);
        
        if(DEBUG) {
            console.log('[MESSAGES DATA]', data);
        }
    },
    
    /**
     * Merge data into template and display
     * @param no_transition Boolean Whether or not to skip transition
     */
    populate_template: function(no_transition) {
        var prev_results = this.controller.get_results_div();
        if(prev_results) {
            prev_results.destroy();
        }
        
        var template = $('message_template').innerHTML;
        var messageItem = '';
        var threads = this.data;
        var current_user = this.controller.get_user();
        
        // setup new container
        var new_results = new Element('div', {class: 'results'});
        var ul = new Element('ul', {
            class: 'msList' + (no_transition ? ' no_animate' : ' animate') 
        });
        
        if(threads.length > 0) {
            // timer for animation
            var duration = 200;
            
            for(var i = 0; i < threads.length; i++) {
                if( ! threads[i].from) {
                    if(DEBUG) console.log('This message has no from object', threads[i].id);
                    continue;
                }
                
                if(duration > 1000)
                    duration = 200;
                else
                    duration = duration + 100;
                
                var data = {};
                data.subject        = !threads[i].subject || threads[i].subject == '' ? '(no subject)' : threads[i].subject;
                data.id             = threads[i].id;
                data.message_count  = threads[i].comments && threads[i].comments.data ? threads[i].comments.data.length + 1 : 0;
                
                if(threads[i].comments && threads[i].comments.data) {
                    data.message = threads[i].comments.data[threads[i].comments.data.length - 1].message;
                }
                else {
                    data.message = threads[i].message;
                }
                
                data.unread         = this.unread.contains(data.id) ? 'unread' : 'read';
                
                // messages initially sent by current user, display other participant
                if(threads[i].from.id == current_user.id) {
                    var participants = threads[i].to && threads[i].to.data ? threads[i].to.data : [];
                    for(var to = 0; to < participants.length; to++) {
                        // use first participant that is not yourself
                        if(participants[to] && participants[to].id != current_user.id) {
                            data.user_name = participants[to].name;
                            data.user_id = participants[to].id;
                            data.user_image = 'http://graph.facebook.com/' + participants[to].id + '/picture';
                            break;
                        }
                    }
                }
                else {
                    data.user_name = threads[i].from.name;
                    data.user_id = threads[i].from.id;
                    data.user_image = 'http://graph.facebook.com/' + threads[i].from.id + '/picture';
                }
                
                data.date = new Date().parse(threads[i].updated_time).timeDiffInWords();
                
                // Apply the template
                messageItem = template.substitute(data);
                
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
                        html: messageItem,
                        id: 'ms_' + threads[i].id,
                        thread_id: threads[i].id,
                        class: 'clearfix ' + data.unread,
                        styles: styles,
                        events: {
                            'click' : function(event, clicked) {
                                // Tracking
                                GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/external');
                                
                                event.stop();
                                var thread_id = this.getProperty('thread_id');
                                var url = 'http://www.facebook.com/?page=1&sk=messages&tid=' + thread_id;
                                
                                // remove from unread list
                                var unread = JSON.decode(window.localStorage.getItem(KEYS.UNREAD_MESSAGE_IDS));
                                if(unread && unread.contains(thread_id)) {
                                    if(DEBUG)
                                        console.log('Removing from unread list');
                                        
                                    unread = unread.erase(thread_id);
                                    window.localStorage.setItem(KEYS.UNREAD_MESSAGE_IDS, JSON.encode(unread));
                                }
                                
                                this.removeClass('unread');
                                
                                pokki.openURLInDefaultBrowser(url);
                                pokki.closePopup();
                            }
                        }
                    })
                );
            }
            
            // Unread count display value
            var unreadcount = window.localStorage.getItem(KEYS.UNREAD_MSG_COUNT_DISPLAY);
            if(!unreadcount)
                unreadcount = 0;
            
            // Create view more link
            var div = new Element('div', {
                id: MORE.MESSAGES,
                class: 'paging-more',
                html: '<strong>See All Messages</strong><br /><span class="unread">' + unreadcount + ' unread</span>',
                events: {
                    click: function() {
                        GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/external');
                        pokki.openURLInDefaultBrowser('http://www.facebook.com/?sk=messages');
                        pokki.closePopup();
                    }.bind(this)
                }
            });
        
            new_results.grab(ul);
            new_results.grab(div);
        }
        // No messages
        else {
            var div = new Element('div', {
                class: 'no-items messages',    
                html: '<img src="img/no-messages.png" />' +
                    'No new messages.<br />' +
                    '<strong><a href="https://www.facebook.com/inbox?compose">Send a Message</a></strong>'
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