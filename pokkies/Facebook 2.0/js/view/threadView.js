/**
 * Facebook Pokki / threadView.js
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
var ThreadView = new Class({
	Extends: BaseView,
	/**
	 * Initialization
	 * @param   controller	instance	The controller calling creating the view
	 * @param   thread_id	string		The ID of the thread that's being triggered
	 */
	initialize: function(controller, thread_id) {

		this.thread_id = thread_id;
		this.content_id = CONTENT.THREAD;
		this.content = $(this.content_id);
		this.already_open = false;
		this.controller = controller;
	
		if (DEBUG)
			console.log('Load message thread #'+this.thread_id);
		
		// Get the related thread data
		this.threads = JSON.decode(window.localStorage.getItem(KEYS.MESSAGES_CACHE));

		if (DEBUG)
			console.log('[THREADS]', this.threads);
		
		for (var i = 0; i < this.threads.length; i++) {
			if (this.threads[i].id === this.thread_id) {
				this.thread_data = this.threads[i];
				break;
			}
		}

		var current_user = this.controller.get_user();
		
		if (!this.thread_data) {
			console.log('No thread found.');
		}			
		
		if (DEBUG)
			console.log('[THREAD DATA]', this.thread_data);
			
		
		if ($(CONTENT.WRAPPER).hasClass('sub'))
			this.already_open = true;

		this.transition_subcontent();
	},
	
	populate_template: function(no_transition) {
		
		var template = $('thread_template').innerHTML;
		var thread_data = this.thread_data;
		var thread_comments = (thread_data.comments)?thread_data.comments.data:false;
		var thread_content = '';
		var data = {};
		
		
		// setup new results container
		var new_results = new Element('div', {class: 'results'});
		
		// setup new subcontent structure
		if (!no_transition) {
			this.create_new_subcontainer();
		}
		this.content.setProperty('thread_id', this.thread_data.id);
		
		this.content.grab(new_results);
		
		var ul = new Element('ul', {
			class: 'threadMsList'
		});
		
		
		// If there are messages
		if (thread_data) {
		
			// Add the first message (different from the comments list)
			data.user_id = thread_data.from.id;
			data.user_name = thread_data.from.name;
			data.user_image = 'http://graph.facebook.com/' + thread_data.from.id + '/picture';
			data.message = thread_data.message;
			// FB doesn't have the original created time for the first message, so grab the date for the first comment (second message) for now
			if (thread_comments) {
				data.date = new Date().parse(thread_comments[0].created_time).timeDiffInWords();
			} else {
				data.date = new Date().parse(thread_data.updated_time).timeDiffInWords();
			}
			
			// Apply the template
			thread_content = template.substitute(data);
			
			// Create a new <li> for each thread message
			var thread_item = new Element('li', {
					html: thread_content,
					id: 'threadms_' + this.thread_data.id,
					thread_id: this.thread_data.id,
					class: 'clearfix'
				});
			// Append it to the <ul>
			ul.grab(thread_item);			
			
			
			
			// Add the remaining message (from the comments list)
			for (var i = 0; i < thread_comments.length; i++) {
			
				data = {};
				data.user_id = thread_comments[i].from.id;
				data.user_name = thread_comments[i].from.name;
				data.user_image = 'http://graph.facebook.com/' + thread_comments[i].from.id + '/picture';
				data.message = thread_comments[i].message;
				data.date = new Date().parse(thread_comments[i].created_time).timeDiffInWords();
				
				// Apply the template
				thread_content = template.substitute(data);
				
				// Create a new <li> for each thread message
				var thread_item = new Element('li', {
						html: thread_content,
						id: 'threadms_' + thread_comments[i].id,
						thread_id: thread_comments[i].id,
						class: 'clearfix'
					});
				// Append it to the <ul>
				ul.grab(thread_item);
			}

			new_results.grab(ul);

			// Create reply to messages link
			var reply = new Element('div', {
				id: MORE.THREAD_REPLY,
				class: 'paging-more',
				html: '<strong>Go to Your Messages</strong>',
				events: {
					click: function() {
						GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/thread/external');
						pokki.openURLInDefaultBrowser('http://www.facebook.com/messages');
						pokki.closePopup();
					}.bind(this)
				}
			});
			new_results.grab(reply);
			
			
			
			/*	// PROTOTYPE
				// Attempt to simulate the reply mechanism using the Javascript SDK send dialog			 
			var reply_list = '';
			if (DEBUG) console.log('[REPLY RECIPIENTS]', reply_list);
			if (reply_list != '') {
				var reply = new IFrame({
					id: MORE.THREAD_REPLY,
					src: 'https://www.facebook.com/dialog/send?app_id=' + pokki.getScrambled(FB_APP_ID) + '&to=' + reply_list + '&picture=http://clemish.com/spacer.gif&name=Sent%20from%20my%20Facebook%20Pokki&description=Download%20Pokki&link=http://pokki.com&redirect_uri=http://www.pokki.com/facebook/messages/send/success&display=popup',
					frameborder: 0,
					scrolling: 'no',
					name: MORE.THREAD_REPLY,
					events: {
						load: function() {
							if (DEBUG) console.log('[Facebook Reply/Send Iframe Loaded]');
							this.show();
													
							var reply_doc = reply.contentDocument;
							var overrideStyling = reply_doc.createElement('style');
							overrideStyling.setAttribute('type', 'text/css');
							overrideStyling.innerHTML = '#pageheader, .UIActionLinks_bottom, #cancel, .toField, .interaction_form {display: none;} #feedform_user_message {width: 320px; height: 60px; resize: none;} .pam {padding: 0}';
							reply_doc.getElementById("feedform_user_message")._has_control = false;
							reply_doc.getElementById("feedform_user_message").addEventListener('keyup', function() {
								reply.style.height = (parseInt(this.style.height.slice(0,-2)) + 90) + 'px';
							});
							reply_doc.getElementsByTagName("head")[0].appendChild(overrideStyling);	
						}
					}
				}).hide();
				new_results.grab(reply);
			}
			*/
			
			// Scroll to the appropriate location.
			var scrollToLatestMessages = new Fx.Scroll(this.content.getParent('.content')).set(0, this.content.offsetHeight);
			//var scrollToLatestMessages = new Fx.Scroll(this.content.getParent('.content')).toBottom();
			
		
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
		
	}
	
});