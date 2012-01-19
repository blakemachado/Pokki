/**
 * Facebook Pokki / eventView.js
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

var EventView = new Class({
	Extends: BaseView,
		
	/**
	 * Initialization
	 * @param   controller	instance	The controller calling creating the view
	 * @param   event_id	string		The ID of the event that's being triggered
	 */
	initialize: function(controller, event_id) {

		this.event_id = event_id;
		this.content_id = CONTENT.EVENT;
		this.content = $(this.content_id);
		this.already_open = false;
		this.controller = controller;
		this.event_data = false;
		this.rsvp_status = false;
		this.current_user = this.controller.get_user();
		this.rsvp_button = false;
		this.invitees_cache = false;
		this.invitees_cache_index = null;
		
		this.event_position = 0;
			
		if (DEBUG)
			console.log('Load event details #'+this.event_id);
		
		// Get the related event data
		this.events = JSON.decode(window.localStorage.getItem(KEYS.EVENTS_CACHE));

		if (DEBUG)
			console.log('[EVENTS]', this.events);
		
		for (var i = 0; i < this.events[0].fql_result_set.length; i++) {
			if (+this.events[0].fql_result_set[i].eid === this.event_id) {
				this.event_position = i;
				this.rsvp_status = this.events[0].fql_result_set[i].rsvp_status;
				break;
			}
		}
		for (var i = 0; i < this.events[1].fql_result_set.length; i++) {
			if (this.events[1].fql_result_set[i].eid === this.event_id) {
				this.event_data = this.events[1].fql_result_set[i];
				break;
			}
		}
		
		if (DEBUG) console.log('[Event DATA]', this.event_data);
			
		
		if ($(CONTENT.WRAPPER).hasClass('sub'))
			this.already_open = true;

		this.transition_subcontent();
	},
	
	/**
	 * Merge data into template and display
	 * @param no_transition Boolean Whether or not to skip transition
	 */   
	populate_template: function(no_transition) {
		
		var template = $('event_template').innerHTML;
		var event_data = this.event_data;
		event_data.rsvp = this.rsvp_status;
		var data = {};
		var event_privacy = [];
		event_privacy['SECRET'] = 'Invite-Only Event';
		event_privacy['CLOSED'] = 'Invite-Only Event';
		event_privacy['OPEN'] = 'Public Event';
					
		// setup new subcontent structure
		if (!no_transition) {
			this.create_new_subcontainer();
		}
		this.content.setProperty('event_id', event_data.eid);
				
		// If there are event data
		if (event_data) {
		
			data.id = event_data.eid;
			data.event_img = event_data.pic_big;
			data.name = event_data.name;
			data.tag = event_privacy[event_data.privacy] + ' &middot; By ' + event_data.host;
			var date_object = new Date(event_data.start_time * 1000);
			data.date = date_object.format("%A, %B %e, %Y");
			data.time = date_object.format("%l:%M %p") + ' &ndash; ' + new Date(event_data.end_time * 1000).format("%l:%M %p");
			data.location = (event_data.location && event_data.location != "")?'<span class="icon"></span>'+event_data.location:'';
			if (event_data.venue) {
				data.location += '<p class="address">';
				data.location += (event_data.venue.street)?event_data.venue.street:'';
				data.location += (event_data.venue.city)?'<br />'+event_data.venue.city:'';
				data.location += (event_data.venue.state)?', '+event_data.venue.state:'';
				data.location += (event_data.venue.zip)?' '+event_data.venue.zip:'';
				data.location += '</p>';
			}
			data.desc = (event_data.description)?'<span class="icon"></span>'+event_data.description:'';
			data.rsvp = this.controller.rsvp_display[event_data.rsvp];
		
		
			var event_html = template.substitute(data);
			
			var div = new Element('div', {
				class: 'event_details clearfix',
				event_id: data.id,
				html: event_html
			});
			
			
			this.content.grab(div);
			
			// Set Descriptions Height
			var event_info_height = this.content.getElement('.event_main .event_info').getSize().y;
			var event_description_height = 370 - event_info_height;
			var event_description_container = this.content.getElement('.event_main .descriptions');
			var event_description_top = this.content.getElement('.event_main .event_dscriptions_top');
			event_description_container.setStyle('height', event_description_height+'px').addEvent('scroll', function() {
				if (event_description_container.getScroll().y > 10) {
					event_description_top.removeClass('hide');
				} else {
					event_description_top.addClass('hide');
				}
			});
			
			this.invitees_cache = JSON.decode(window.localStorage.getItem(KEYS.EVENT_INVITEES_CACHE));
			if (this.invitees_cache && this.invitees_cache.length > 0) {
				for (var i = 0; i < this.invitees_cache.length; i++) {
					if (this.event_id === this.invitees_cache[i].event_id) {
						this.invitees_cache_index = i;
						break;
					}
				}
			}
			if (this.invitees_cache_index != null) {	
			//	(function() {
					//this.build_invitees_list(invitees_cache[i].invitees);
					this.build_invitees_menu(this.invitees_cache[this.invitees_cache_index].invitees);
			//	}).delay(500, this);
			}
			else {
				this.content.getElement('.event_invitees_menu').addClass('animate');
				this.fetch_invitees();
			}
			
			this.rsvp_button = new DropdownSnippet(this.content.getElement('.dropdown_wrapper'), this.rsvp_callback.bind(this));
			
		}
		// No event data
		else {
			console.log('No event found.');
			var div = new Element('div', {
				class: 'no-items events',    
				html: '<img src="img/no-events.png" />' +
					'No new events<br />' +
					'<strong><a href="http://www.facebook.com/events">See All Events</a></strong>'
			});
			this.content.grab(div);	
		}	
	},
	
	/** 	
	 *	RSVP ajax call
	 *  @param item	string	the rsvp response to be posted to the call
	 */	
	rsvp_callback: function(item) {
		var rsvp = item.getProperty('rsvp');
		
		var url = 'https://graph.facebook.com/'+this.event_id+'/'+this.controller.rsvp_call[rsvp];
		
		this.controller.post_graph_call(url, function(resp) {
			if (DEBUG) console.log('[EVENT] RSVP', resp);
			if (resp) {
				this.events[0].fql_result_set[this.event_position].rsvp_status = rsvp;
				window.localStorage.setItem(KEYS.EVENTS_CACHE, JSON.encode(this.events));
				$$('#events-main #ev_'+this.event_id+' .events_actions .status').set('html', this.controller.display_status[rsvp]);
				this.rsvp_button.update_button_text(this.controller.rsvp_display[rsvp]);
				
				// Update the invitees cache to reflect user's RSVP
				if (this.invitees_cache && this.invitees_cache.length > 0 && this.invitees_cache_index != null) {
					var invitees = this.invitees_cache[this.invitees_cache_index].invitees;
					for (var i = 0; i < invitees.length; i++) {
						if (+invitees[i].id == +this.current_user.id) {
							invitees[i].rsvp_status = rsvp;
							this.build_invitees_menu(invitees);
							window.localStorage.setItem(KEYS.EVENT_INVITEES_CACHE, JSON.encode(this.invitees_cache));
							console.log(invitees[i].id, invitees[i].rsvp_status);
							break;
						}
					}
				}
			}
		}.bind(this));
	},
	
	/** 	
	 *	Ajax call to fetch the list of invitees
	 */	
	fetch_invitees: function() {
		if (DEBUG) console.log('[EVENTS]', 'Fetching Invitees');
		this.controller.make_graph_call(
			"https://graph.facebook.com/"+this.event_id+"/invited",
			{
				access_token: this.controller.get_access_token(),
				format: "json"
			},
			this.invitees_callback.bind(this)
		);
	},
	
	/** 	
	 *	Callback function for invitees ajax call
	 *  @param resp		object	the ajax response
	 */
	invitees_callback: function(resp) {
		console.log(this.event_id);
		if (resp.error) {
			if (resp.error.message.contains('190')) {
				window.localStorage.removeItem(KEYS.FB_ACCESS_TOKEN);
				new LoginController();
			}
			else if (resp.error.message.contains('(#4)') || resp.error.message.contains('request limit reached')) {
				pokki.rpc('stop_badge_poll();');
				pokki.rpc('test_badge_poll();');
				console.log(resp.error.message);
			}
			else if (resp.error.message) {
				console.log(resp.error.message);
			}
		}
		else if (resp.data && resp.data.length > 0) {
		
			// Check if the invitees list is already in cache
			this.invitees_cache = JSON.decode(window.localStorage.getItem(KEYS.EVENT_INVITEES_CACHE));
			if (!this.invitees_cache) {
				this.invitees_cache = new Array();
			}
			// Add this particular list
			this.invitees_cache.include({event_id:this.event_id, invitees:resp.data});
			// Cache the invitees list
			window.localStorage.setItem(KEYS.EVENT_INVITEES_CACHE, JSON.encode(this.invitees_cache));
			//this.build_invitees_list(resp.data);
			for (var i = 0; i < this.invitees_cache.length; i++) {
				if (this.event_id === this.invitees_cache[i].event_id) {
					this.invitees_cache_index = i;
					break;
				}
			}
			this.build_invitees_menu(resp.data);
		}
	},
	
	
	/** 	
	 *	Build the invitees menu
	 *  @param invitees_data	array	the list of invitees
	 */
	build_invitees_menu: function(invitees_data) {
		
		if (invitees_data.length <= 0) return false;
		var event_id = this.event_id;
		var menu = this.content.getElement('.event_invitees_menu');
				
		var invitees_counter = {
			not_replied: 0,
			unsure: 0,
			attending: 0,
			declined: 0
		}
		var invitees_lists = {
			not_replied: [],
			unsure: [],
			attending: [],
			declined: []
		}
			
		for (var i = 0; i < invitees_data.length; i++) {
			invitees_counter[invitees_data[i].rsvp_status]++;
			invitees_lists[invitees_data[i].rsvp_status].include(invitees_data[i]);
		}		
		
		var openedList = false;
		Object.each(invitees_counter, function(counter, key) {
			if (counter > 0) {
				menu.getElement('.invitees_'+key).removeClass('hide').removeEvent('click').addEvent('click', function(e) {
					e.preventDefault();
					e.stop();
					$(this).getSiblings('li').removeClass('selected');
					if (openedList && openedList.pane_id === 'invitees_'+event_id+'_'+key && openedList.already_opened) {
						openedList.hide_pane();
						openedList = false;
						//$(this).removeClass('selected');
					} else {
						openedList = new QuickListView(invitees_lists[key], 'invitees_'+event_id+'_'+key, $(this));
						//$(this).addClass('selected');
					}
				});
				menu.getElement('.invitees_'+key+' span').set('html', '('+counter+')');
			} else {
				menu.getElement('.invitees_'+key).addClass('hide');
			}
		});
		
		(function() {	
			menu.removeClass('hide');
		}).delay(200, this);		
		
	},
	
	
	/**
	 * 	DEPRECATED
	 *	It was used when we show the full list of invitees in the event details subpane
	 */
	build_invitees_list: function(invitees_data) {
				
		//if (DEBUG) console.log('[EVENT DETAILS DATA]', invitees_data);
		var heading_not_replied = new Element('div', {
			id: 'inviteesHeading_not_replied',
			class: 'inviteesHeading hide',
			html: 'Not Yet Replied <span></span>'			});
		var heading_unsure = new Element('div', {
			id: 'inviteesHeading_unsure',
			class: 'inviteesHeading hide',
			html: 'Maybe <span></span>'					});
		var heading_attending = new Element('div', {
			id: 'inviteesHeading_attending',
			class: 'inviteesHeading hide',
			html: 'Going <span></span>'					});
		var heading_declined = new Element('div', {
			id: 'inviteesHeading_declined',
			class: 'inviteesHeading hide',
			html: 'Not Going <span></span>'				});
		var ul_not_replied = new Element('ul', { id: 'invitees_not_replied', class: 'hide'	});
		var ul_unsure = new Element('ul', { id: 'invitees_unsure', class: 'hide'			});
		var ul_attending = new Element('ul', { id: 'invitees_attending', class: 'hide'		});
		var ul_declined = new Element('ul', { id: 'invitees_declined', class: 'hide'		});
					
		
		var invitees_counter = {
			not_replied: 0,
			unsure: 0,
			attending: 0,
			declined: 0
		}
		
		var invitees_container = this.content.getElement('.event_invitees');
		
		var template = $('search_user_template').innerHTML;
		for (var i = 0; i < invitees_data.length; i++) {
			var data = {};
			data.user_image = 'https://graph.facebook.com/'+invitees_data[i].id+'/picture';
			data.user_name = invitees_data[i].name;
			var li = new Element('li', {
				html: '<a href="http://www.facebook.com/'+invitees_data[i].id+'" class="clearfix">'+template.substitute(data)+'</a>',
				class: 'clearfix'
			});
			switch(invitees_data[i].rsvp_status) {    	
			case 'not_replied':
//				invitees_counter.not_replied++;
//				ul_not_replied.grab(li);
				break;
			case 'unsure':
				invitees_counter.unsure++;
				ul_unsure.grab(li);
				break;
			case 'attending':
				invitees_counter.attending++;
				ul_attending.grab(li);
				break;
			case 'declined':
				invitees_counter.declined++;
				ul_declined.grab(li);
				break;
			default:
			}
			
			
			invitees_container.grab(heading_attending);
			invitees_container.grab(ul_attending);
			invitees_container.grab(heading_unsure);
			invitees_container.grab(ul_unsure);
			invitees_container.grab(heading_not_replied);
			invitees_container.grab(ul_not_replied);
			invitees_container.grab(heading_declined);
			invitees_container.grab(ul_declined);
			if (invitees_counter.not_replied > 0) {
				heading_not_replied.getElement('span').set('html', '('+invitees_counter.not_replied+')');
				heading_not_replied.removeClass('hide');
				ul_not_replied.removeClass('hide');
			}		
			if (invitees_counter.unsure > 0) {
				heading_unsure.getElement('span').set('html', '('+invitees_counter.unsure+')');
				heading_unsure.removeClass('hide');
				ul_unsure.removeClass('hide');
			}
			if (invitees_counter.attending > 0) {
				heading_attending.getElement('span').set('html', '('+invitees_counter.attending+')');
				heading_attending.removeClass('hide');
				ul_attending.removeClass('hide');
			}
			if (invitees_counter.declined > 0) {
				heading_declined.getElement('span').set('html', '('+invitees_counter.declined+')');
				heading_declined.removeClass('hide');
				ul_declined.removeClass('hide');
			}

		};
		
		(function() {
			this.content.getElement('.event_invitees_wrapper').removeClass('animate');
		}).delay(300, this);
	}
	
});