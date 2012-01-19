/**
 * Facebook Pokki / eventsView.js
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * Note: needs to be updated to use LocalStore class for consistency
 *
 * @version     2.1
 * @license     MIT License
 * @author      Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */

var EventsView = new Class({
    Extends: BaseView,

    /**
     * Initialization (see BaseView class)
     */
    initialize: function(data, controller, no_transition) {
        
        this.main = $(MAIN.EVENTS);
        this.content_id = CONTENT.EVENTS;
        this.content = $(this.content_id);
		
        this.parent(data, controller, no_transition);
        
        if(DEBUG) console.log('[EVENTS DATA]', data);
    },
    
    /**
     * Merge data into template and display
     * @param no_transition Boolean Whether or not to skip transition
     */
    populate_template: function(no_transition) {
    
   		this.content.empty();
   		
   		var eventslist = this.data[0].fql_result_set;
   		var eventsdetails = this.data[1].fql_result_set;
    
        var template = $('events_template').innerHTML;
                
        // setup new container
        var new_results = new Element('div', {class: 'results'});

		if (DEBUG) console.log('[EVENTS]', 'Populating Pane');

		
        if (eventsdetails.length > 0) {
       	
	       	
	       	/* SETUP SECTIONS BASED ON TIME */
	       	var sectionedEvents = [[],[],[],[],[]];
	       		       	
	       	var sectionHeadingTitle = new Array();
	       	sectionHeadingTitle[0] = { key: 'today', display: 'Today'};
	       	sectionHeadingTitle[1] = { key: 'tomorrow', display: 'Tomorrow'};
	       	sectionHeadingTitle[2] = { key: 'week', display: 'This Week'};
	       	sectionHeadingTitle[3] = { key: 'month', display: 'This Month'};
	       	sectionHeadingTitle[4] = { key: 'others', display: 'Others'};
	       	
	       	var nowTime = new Date();
	       	var today = Date.parse((nowTime.getMonth()+1)+'/'+nowTime.getDate()+'/'+nowTime.getFullYear());
	       	// Round down the now time to midnight and add 24 hours to get the tomorrow's date
	       	var timestamp_tomorrow = (today / 1000) + (1*24*60*60);
	       	var timestamp_twodays = (today / 1000) + (2*24*60*60);
	       	var timestamp_thisweek = (today / 1000) + ((7-today.getDay())*24*60*60);
	       	var timestamp_thismonth = new Date(nowTime.getFullYear(), nowTime.getMonth() + 1, 0) / 1000 + (1*24*60*60);
	       	//if (DEBUG) console.log('Tomorrow', timestamp_tomorrow, new Date(timestamp_tomorrow*1000));
	       	//if (DEBUG) console.log('This Week', timestamp_thisweek, new Date(timestamp_thisweek*1000));
	       	//if (DEBUG) console.log('This Month', timestamp_thismonth, new Date(timestamp_thismonth*1000));
	       	
  	    	// Separate the data set into different sections based on time    
        	for (var i = 0; i < eventsdetails.length; i++) {				
				if (eventsdetails[i].start_time < timestamp_tomorrow) {
					sectionedEvents[0].push(eventsdetails[i]);
				}
				else if (eventsdetails[i].start_time < timestamp_twodays) {
					sectionedEvents[1].push(eventsdetails[i]);
				}
				else if (eventsdetails[i].start_time < timestamp_thisweek) {
					sectionedEvents[2].push(eventsdetails[i]);
				}
				else if (eventsdetails[i].start_time < timestamp_thismonth) {
					sectionedEvents[3].push(eventsdetails[i]);
				}
				else {
					sectionedEvents[4].push(eventsdetails[i]);				
				}
        	}
        	
        	if (DEBUG) console.log(sectionedEvents);        	
        	
        	var eventItem;
        	var ul;
        	
        	// Loop through each section
        	for (var l = 0; l < sectionedEvents.length; l++) {
        		var list = sectionedEvents[l];
        		// if there is no event in that section, skip
        		if (list.length <= 0)
        			continue;
    		
	        	ul = new Element('ul', {
	        	    class: 'evList'
	        	});
	        	// Loop through each event
				for (var i = 0; i < list.length; i++) {
				            
					var data = {};
					data.id = list[i].eid;
					for (var j = 0; j < eventslist.length; j++) {
						if (+eventslist[j].eid == data.id) {
							data.rsvp = this.controller.display_status[eventslist[j].rsvp_status];
							break;
						}
					}
					data.event_image = list[i].pic_square;
					data.event_name = list[i].name;
					data.start_time = list[i].start_time;
					data.brief = new Date(data.start_time * 1000).format('%a, %b %e, %Y');
					data.brief += (list[i].location)?' &middot; '+list[i].location:'';
					data.href = "http://www.facebook.com/events/"+data.id;
					                
				    // Apply the template
				    event_html = template.substitute(data);
				  
				    // Create a new <li> for each event
				    var event_item = new Element('li', {
				    		html: event_html,
				    		id: 'ev_' + data.id,
				    		event_id: data.id,
				    		class: 'clearfix show_subcontent '
				    });
				    // Add the show_thread even to the message <li>
				    event_item.addEvent('click', this.show_event.bind(this, event_item));
				    
				    // Add to list
				    ul.grab(event_item);
				}

				var heading = new Element('div', { id: 'evHeading_'+sectionHeadingTitle[l].key, class: 'srHeading '+sectionHeadingTitle[l].key, html: sectionHeadingTitle[l].display, 'type': sectionHeadingTitle[l].key });
				
				new_results.grab(heading);
				new_results.grab(ul);
        		
        	}
        	
   
            
            // Create view more link
            var div = new Element('div', {
                id: MORE.EVENTS,
                class: 'paging-more',
                html: '<strong>See All Events</strong>',
                events: {
                    click: function() {
                        GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/external');
                        pokki.openURLInDefaultBrowser('http://www.facebook.com/events');
                        pokki.closePopup();
                    }.bind(this)
                }
            });
            
            new_results.grab(div);
            
            
        }
        else {
            // No new notifications messaging
            var div = new Element('div', {
                class: 'no-items events',    
                html: '<img src="img/no-events.png" />' +
                    'No new events<br />' +
                    '<strong><a href="http://www.facebook.com/events">See all events</a></strong>'
            });
            
            new_results.grab(div);
        }
        
        this.controller.add_content(new_results);
                
        ul = null;
        div = null;
        new_results = null;

    },
    
    /**
     * Show the event and launch the event view in 2nd level pane
     */ 
	show_event: function(event_item) {
		//event.stopPropagation();
		event.preventDefault();
		var event_id = +event_item.getProperty('event_id');
		if (event_item.hasClass('selected')) {
			$(CONTENT.WRAPPER).removeClass('sub');
			event_item.removeClass('selected');
		}
		else {
			// Can't use getSiblings because the list items are divided in different sections based on time
			//event_item.getSiblings('.selected').removeClass('selected');
			$$('#events-main .show_subcontent.selected').removeClass('selected');
			event_item.removeClass('unread').addClass('selected');
				
			var view = new EventView(this.controller, event_id);		
			GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/show_event');
		}
	}
});