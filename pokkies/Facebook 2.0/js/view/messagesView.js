/**
 * Facebook Pokki / messagesView.js
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * Note: needs to be updated to use LocalStore class for consistency
 *
 * @version     2.1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * 				Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
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
		
		this.main = $(MAIN.MESSAGES);
		this.content_id = CONTENT.MESSAGES;
		this.content = $(this.content_id);
		
		this.parent(data, controller, no_transition);
		
		// Update last seen
		if (data.length > 0) {
			window.localStorage.setItem(KEYS.LAST_MESSAGE_SEEN, Util.get_current_epoch_time());
		}
		
		if(DEBUG) {
			console.log('[MESSAGES DATA]', data);
		}
	},
	
	/**
	 * Merge data into template and display
	 * @param no_transition Boolean Whether or not to skip transition
	 */
	populate_template: function(no_transition) {
	
		this.content.empty();
		
		var template = $('message_template').innerHTML;
		var messageItem = '';
		var threads = this.data;
		var current_user = this.controller.get_user();

		
		// setup new container
		var new_results = new Element('div', {class: 'results'});		
		var ul = new Element('ul', {
			class: 'msList'
		});
		
		
		if (DEBUG) console.log('[MESSAGES]', 'Populating Pane');  


		if(threads.length > 0) {
			
			for(var i = 0; i < threads.length; i++) {
				// Check whether there is a message sender, if not, skip.
				if (!threads[i].from) {
					if(DEBUG) console.log('This message has no from object', threads[i].id);
					continue;
				}
				
				/*	// MOVED RECIPIENT FILTERING LOGIC TO THE AJAX CALL
				var user_is_a_recipient = false;
				//if (DEBUG) console.log('[Recipients list]', threads[i].to.data);
				var recipients = threads[i].to.data;
				for (var to = 0; to < recipients.length; to++) {
					if (recipients[to] && recipients[to].id === current_user.id) {
						user_is_a_recipient = true;
						break;
					}
				}
				if (!user_is_a_recipient) {
					if(DEBUG) console.log('User is not a recipient of this thread', threads[i].id);
					continue;
				}
				*/

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
				
				data.unread = this.unread.contains(data.id) ? 'unread' : 'read';
				
				// messages initially sent by current user, display other participant
				if(threads[i].from.id == current_user.id && threads[i].to.data.length > 1) {
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
				
				// Build the multiple participants
				var recipients = threads[i].to.data;
				if (recipients.length > 2) {
				// Only proceed if there are more than 2 people in the thread				
					if (recipients.length === 3) {
					// If there are 3 people total, just list out both names					
						// Verify that both recipients are not null
						if (recipients[1] && recipients[2]) {
							var second_name = (recipients[1].id === current_user.id)?recipients[2].name:recipients[1].name;
						} else {
							var second_name = '1 other';
						}
						data.user_name += ', '+second_name;
					} else {
					// Otherwise, simply display a number of remaining recipients
					// (minus the user and the first recipient)
						data.user_name += ', '+(recipients.length-2)+' others';
					}
				}
				
				data.date = new Date().parse(threads[i].updated_time).timeDiffInWords();
				
				// Apply the template
				messageItem = template.substitute(data);

				// Create a new <li> for each message thread
				var message_thread = new Element('li', {
						html: messageItem,
						id: 'ms_' + threads[i].id,
						thread_id: threads[i].id,
						class: 'clearfix show_subcontent ' + data.unread
					});
				// Add the show_thread even to the message <li>
				message_thread.addEvent('click', this.show_thread.bind(this, message_thread));
				// Append it to the HTML <ul>
				ul.grab(message_thread);
			
			}
			
			// Unread count display value
			/*
			var unreadcount = window.localStorage.getItem(KEYS.UNREAD_MSG_COUNT_DISPLAY);
			if(!unreadcount)
				unreadcount = 0;
			*/
			
			// Create view more link
			var moreMessages = new Element('div', {
				id: MORE.MESSAGES,
				class: 'paging-more',
//				html: '<strong>See All Messages</strong><br /><span class="unread">' + unreadcount + ' unread</span>',
				html: '<strong>See All Messages</strong>',
				events: {
					click: function() {
						GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/external');
						pokki.openURLInDefaultBrowser('http://www.facebook.com/?sk=messages');
						pokki.closePopup();
					}.bind(this)
				}
			});
		
			new_results.grab(ul);
			new_results.grab(moreMessages);
		}
		// No messages
		else {
			var div = new Element('div', {
				class: 'no-items messages',    
				html: '<img src="img/no-messages.png" />' +
					'No new messages<br />' +
					'<strong><a href="https://www.facebook.com/inbox?compose">Send a Message</a></strong>'
			});
			
			new_results.grab(div);
		}
		
		this.controller.add_content(new_results);
		
		ul = null;
		div = null;
		new_results = null;
		
	},
	
	/**
	 * Show the thread and launch the thread view in 2nd level pane
	 */ 	
	show_thread: function(message_thread) {
		event.stopPropagation();
		event.preventDefault();
		var thread_id = message_thread.getProperty('thread_id');

		// remove from unread list
		var unread = JSON.decode(window.localStorage.getItem(KEYS.UNREAD_MESSAGE_IDS));
		if(unread && unread.contains(thread_id)) {
			if (DEBUG) console.log('Removing from unread list');
			unread = unread.erase(thread_id);
			window.localStorage.setItem(KEYS.UNREAD_MESSAGE_IDS, JSON.encode(unread));
		}
		if (message_thread.hasClass('selected')) {
			message_thread.removeClass('selected');
			$(CONTENT.WRAPPER).removeClass('sub');
		}
		else {
			message_thread.getSiblings('.selected').removeClass('selected');
			message_thread.removeClass('unread').addClass('selected');
				
			var view = new ThreadView(this.controller, thread_id);		
			GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/show_thread');
		}
	}
	
});