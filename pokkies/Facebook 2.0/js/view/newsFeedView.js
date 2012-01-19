/**
 * Facebook Pokki / newsFeedView.js
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

var NewsFeedView = new Class({
	Extends: BaseView,
	/**
     * Initialization (see BaseView class)
	 */
	initialize: function(data, controller, no_transition) {	
		this.main = $(MAIN.NEWS_FEED);
		this.content_id = CONTENT.NEWS_FEED;
		this.content = $(this.content_id);
		
		this.parent(data, controller, no_transition);

		// Create the status update box
		if (!$('status_updater'))
			this.content.grab(this.status_update_form(), 'top');

		this.main.getElement('.content').removeEvent('scroll').addEvent('scroll', this.infinite_scrolling.bind(this));
		if ($(MORE.NEWS_FEED) && !$(MORE.NEWS_FEED).getPrevious('.more-loading')) {
			$(MORE.NEWS_FEED).removeClass('hide');
		}
		
		if (DEBUG) console.log('[NEWSFEED DATA]', data);
	},
	
	/**
  	 * Create the status update form
	 */
	status_update_form: function() {
		var form = new Element('form', {
			id: 'status_updater',
			class: 'clearfix',
			events: {
				submit: this.submit_update.bind(this.controller)
			}
		});
		
		form.grab(new Element('div', {
			class: 'user_thumb',
			html: '<img src="' + this.controller.get_user_picture() + '" />'
		}));
		
		form.grab(
			(new Element('div',
				{
					class: 'textarea_wrap'
				})
			).grab(
				new Element('textarea',
					{
						id: 'update',
						name: 'update',
						placeholder: 'What\'s on your mind?',
						events: {
							focus: this.focus_textarea.bind(this),
							blur: this.blur_textarea.bind(this),
							keydown: this.listen_textarea.bind(this)
						},
						styles: {
							height: 14
						}
					}
				)
			)
		);
		form.grab(new Element('button', {
			type: 'submit',
			class: 'uiButton uiButtonConfirm',
			html: '<span>Share</span>',
			events: {
				click: this.submit_update.bind(this)
			}
		}));
		
		return form;
	},
	/**
	 * Event listener for the focus on the textarea
	 */
	focus_textarea: function() {
		$('status_updater').addClass('open');
	},
	/**
	 * Event listener for the blur on the textarea
	 */
	blur_textarea: function() {
		 if($('status_updater').update.get('value').trim() == '') {
			$('status_updater').removeClass('open');
			$('status_updater').reset();
			$('status_updater').update.tween('height', 15).get('tween').chain(function() {
				if(this.dummy_div) {
					this.dummy_div.destroy();
					this.dummy_div = false;
				}
			}.bind(this));
		}
	},
	/**
	 * Event listener for auto-grow and for submitting
	 */
	listen_textarea: function(e) {
		this.expand_textarea();
		
		if(e.key == 'enter') {
			e.stop();
			
			var err = $('status_updater').getElement('span.error');
			if(err) err.destroy();
			
			if($('status_updater').update.value.trim() != '')
				this.submit_update(e);
				
			return false;
		}
		return true;
	},
	/**
	 * Post status update 
	 */
	submit_update: function(e) {
		if(DEBUG) console.log('[SUBMIT STATUS UPDATE]');
		e.stop();
		this.controller.status_update(
			$('status_updater').update.value,
			this.submit_update_callback.bind(this),
			this.failed_update_callback.bind(this)
		);
	},
	/**
	 * Post status update callback
	 * TODO: Refactor all the link clicks to utilize event delegation... this is messy
	 */
	submit_update_callback: function(resp) {
		if(resp && resp.id) {
			var user = this.controller.get_user();
		
			// prepare the data
			var data = {
				id: resp.id,
				message: Util.linkify($('status_updater').update.value),
				user_image : 'http://graph.facebook.com/' + user.id + '/picture',
				user_id : user.id,
				user_name : user.name,
				time: '2 seconds ago'
			}
			var item_id = resp.id.split('_');
			var item_url = 'http://www.facebook.com/' + item_id[0] + '/posts/' + item_id[1];
			data.item_url = item_url;
			
			data.actions = '';
			var bling = '';
			bling += '<a id="bling-' + resp.id + '" post_id="' + resp.id + '" class="bling disabled" href="' + item_url + '" like_count="0" comment_count="0">';
				bling += '<span id="like_bling-' + resp.id + '" class="like_bling"><span class="i i-like"></span><span class="like_counter">0</span></span>';
				bling += '<span id="comment_bling-' + resp.id + '" class="comment_bling"><span class="i i-comment"></span><span class="comment_counter">0</span></span>';
			bling += '</a>';
			data.actions += bling;
			
			// Action links
			var reverse = {
				likes: '',
				comments: '',
				other: ''
			};
			
			reverse.likes = '&middot;';
			reverse.likes += ' <span id="like-' + resp.id + '" post_id="' + resp.id + '" class="act action-like">';
			reverse.likes += 'Like';
			reverse.likes += '</span>';
			
			reverse.comments = '&middot;';
			reverse.comments += ' <span id="comment-' + resp.id + '" post_id="' + resp.id + '" class="act action-comment">';
			reverse.comments += 'Comment';
			reverse.comments += '</span>';
			
			reverse.other = '&middot;';
			reverse.other += ' <a href="http://www.pokki.com" post_id="' + resp.id + '" class="act action-get pokki">';
			reverse.other += 'Get Pokki';
			reverse.other += '</a>';
			
			data.actions += reverse.likes;
			data.actions += reverse.comments;
			data.actions += reverse.other;
			
			// display
			var styles = {
				'-webkit-animation-name': 'fadeIn',
				'-webkit-animation-duration': '200ms'
			};    
			var newsfeedItem = $('newsfeed_status_template').innerHTML.substitute(data);
			var ul = this.controller.content.getElement('ul.nfList');
			ul.grab(new Element('li', {
					html: newsfeedItem,
					id: 'nf_' + resp.id,
					class: 'nf clearfix nf_type_status new',
					styles: styles
				}),
				'top'
			);
			
			// attach calls to action links
			var like_links = $('nf_' + resp.id).getElements('.action-like');
			like_links.each(function(el) {
				if(el.get('text').trim() == 'Like')
					el.addEvent('click', this.controller.add_like.bind(this.controller, el.getProperty('post_id')));
				else
					el.addEvent('click', this.controller.remove_like.bind(this.controller, el.getProperty('post_id')));
			}.bind(this));
			
			// add handler to bling
			var bling_links = $('nf_' + resp.id).getElements('.bling');
			bling_links.each(function(el) {
				new BlingSnippet(el.getProperty('id'), el.getProperty('post_id'), el.getProperty('like_count'), el.getProperty('comment_count'));
			});
			
			var comment_links = $('nf_' + resp.id).getElements('.action-comment');
			comment_links.each(function(el) {
				new CommentSnippet(el, el.getProperty('post_id'), this.controller);
			}.bind(this));
			
			// reset status update form
			$('status_updater').reset();
			$('status_updater').update.fireEvent('blur');
			$('status_updater').update.blur();
			
			if (this.content.getElement('.no-items')) {
				this.content.getElement('.no-items').destroy();
			}
			
			GA.trackPageView('/' + this.controller.tab.id + '/status_update');
		}
	},
	/**
	 * Prompt for permissions if callback fails
	 */
	failed_update_callback: function(xhr) {
		var resp = JSON.decode(xhr.responseText);
		
		if(resp.error.type == 'OAuthException' && resp.error.message.contains('200')) {
			// user didn't allow publish_stream, message accordingly
			PERM_Controller = new PermissionsController($(CONTENT.WRAPPER));
		}
	},
	
	/**
	 * Autogrower for textarea
	 **/
	expand_textarea: function() {
		if(!this.dummy_div) {
			this.dummy_div = new Element('div', {
				id: 'dummy_div',
				styles: {
					overflowX: 'hidden',
					position: 'absolute',
					top: 0,
					left: '-999em'
				}
			}).setStyles($('status_updater').update.getStyles("font-size", "font-family", "width", "line-height", "padding")).inject(document.body);
			this.dummy_div.setStyle('width', this.dummy_div.getSize().x - 10);
		}
		
		this.dummy_div.set('html', $('status_updater').update.get('value'));
		var dummyHeight = this.dummy_div.getSize().y;
		if($('status_updater').update.clientHeight != dummyHeight) {
			var newHeight = Math.max(14, dummyHeight);
			$('status_updater').update.set('tween', {
				duration: '180ms',
				link: 'ignore',
				transition: 'linear'
			});
			$('status_updater').update.tween('height', newHeight);
		}
	},
	/**
	 * Merge data into template and display
	 * @param no_transition Boolean Whether or not to skip transition
	 */
	populate_template: function(no_transition) {
	
   		this.content.empty(); 
   				
		// setup new container
		var new_results = new Element('div', {class: 'results'});
		var content;
		
		if (DEBUG) console.log('[NEWS FEED]', 'Populating Pane');  
		
		var feed_items = this.data.data;
		var feed_paging = this.data.paging;
		
		if(feed_items.length > 0) {
				
				content = this.build_content(feed_items);
				new_results.grab(content);
								
				// Create view more link
				var div = new Element('div', {
					id: MORE.NEWS_FEED,
					class: 'paging-more',
					html: '<strong>See More</strong>',
					more: feed_paging.next,
					init_more: feed_paging.next,
					events: {
						click: function() {
							GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/load-more/click');
							this.load_more_content();
						}.bind(this)
					}
				});		
				new_results.grab(div);
							
		}
		// No news feed items
		else {
			var ul = new Element('ul', {
				class: 'nfList'
			});
			var div = new Element('div', {
				class: 'no-items news_feed',    
				html: '<img src="img/no-news_feed.png" />' +
					'There are no posts to show right now'
			});
			
			new_results.grab(ul);
			new_results.grab(div);
		}
		
		this.controller.add_content(new_results);
		
		if (content) this.apply_content_events(content);
		
		new_results = null;
		
		this.parent();
	},
	/**
	 * Append newly ajax-ed content
	 */ 
	append_content: function(data) {
		if (DEBUG) console.log('[NEWSFEED APPEND CONTENT]', data);
		var feed_items = data.data;
		var feed_paging = data.paging;
		
		if (feed_items.length > 0) {
			var more_content = this.build_content(feed_items);

			more_content.inject(MORE.NEWS_FEED, 'before');

			this.apply_content_events(more_content);
			if (feed_paging && feed_paging.next) {
				$(MORE.NEWS_FEED).removeClass('hide').setProperty('more', feed_paging.next);
			}
			// Uncomment the following line to scroll to the newly appended content
			//this.controller.winscroll.toElement(more_content);
			
			GA.trackPageView('/' + this.controller.tab.id + '/autoload_more');
		}
		$(MORE.NEWS_FEED).getPrevious('.more-loading').destroy();		
	},
	/**
	 * Build and format content
	 */ 
	build_content: function(feed_items) {
		var template = '';
		var newsfeedItem = '';
		var type = '';
		var data = {};
		var ul = new Element('ul', {
			class: 'nfList'
		});
		
		for (var i = 0; i < feed_items.length; i++) {
		
			type = feed_items[i].type;
			template = $('newsfeed_' + type + '_template');

			if(template) {
				newsfeedItem = $(template).innerHTML;
				data = {};
				data.user_image = 'http://graph.facebook.com/' + feed_items[i].from.id + '/picture';
				data.user_id = feed_items[i].from.id;
				data.type = feed_items[i].type;
				data.time = new Date().parse(feed_items[i].created_time).timeDiffInWords();
				data.icon = feed_items[i].icon ? '<img src="' + feed_items[i].icon + '" />' : '';
				if (feed_items[i].story) {
					var story_data = this.build_story(feed_items[i].story, feed_items[i].story_tags);
					data.story_class = 'story';
					data.story = story_data.text;
					data.pictures = '<p class="pictures">'+story_data.pictures+'</p>';
					data.message = story_data.text;
				}
				else {
					data.user_name = feed_items[i].from.name;
					data.message = Util.linkify(feed_items[i].message);
				}
				
				// Check whether this is a Spotify item and skip, because we don't get any metadata from Spotify items
				if (feed_items[i].application) {
					if (feed_items[i].application.id == '174829003346' || feed_items[i].application.name == 'Spotify') {
						continue;
					}
				}
							
				var item_id = feed_items[i].id.split('_');
				var item_url = 'http://www.facebook.com/' + item_id[0] + '/posts/' + item_id[1];
				data.item_url = item_url;
				
				// Action Links
				var actions = feed_items[i].actions;
				data.actions = '';
		
				if(actions) {
					var add_dot = false;
					var bling = '';
					var user_likes = feed_items[i].likes ? this._does_user_like(feed_items[i].likes) : false;
					
					// Bling block - disabled, just here for updating counts and such
					//bling += '<span id="bling-' + feed_items[i].id + '-dot">&middot;</span>';
					bling += '<a id="bling-' + feed_items[i].id + '" post_id="' + feed_items[i].id + '" class="bling disabled" href="' + item_url + '" like_count="' + (feed_items[i].likes ? feed_items[i].likes.count : 0) + '" comment_count="' + (feed_items[i].comments ? feed_items[i].comments.count : 0) + '">';
						bling += '<span id="like_bling-' + feed_items[i].id + '" class="like_bling"><span class="i i-like"></span><span class="like_counter">' + (feed_items[i].likes ? feed_items[i].likes.count.format() : 0) + '</span></span>';
						bling += '<span id="comment_bling-' + feed_items[i].id + '" class="comment_bling"><span class="i i-comment"></span><span class="comment_counter">' + (feed_items[i].comments ? feed_items[i].comments.count.format() : 0) + '</span></span>';
					bling += '</a>';
					data.actions += bling;
					
					// Action links
					var reverse = {
						likes: '',
						comments: '',
						others: ''
					};
					
					for(var j = 0; j < actions.length; j++) {
						if('Like' == actions[j].name) {
							
							if (!data.story || !data.story.contains('commented on')) {
								reverse.likes = '&middot;';
								reverse.likes += ' <span id="' + actions[j].name.toLowerCase() + '-' + feed_items[i].id + '" post_id="' + feed_items[i].id + '" class="act action-' + actions[j].name.toLowerCase() + '">';
								reverse.likes += user_likes ? 'Unlike' : 'Like';
								reverse.likes += '</span>';
							}
						}
						else if('Comment' == actions[j].name) {
							reverse.comments = '&middot;';
							reverse.comments += ' <span id="' + actions[j].name.toLowerCase() + '-' + feed_items[i].id + '" post_id="' + feed_items[i].id + '" class="act action-' + actions[j].name.toLowerCase() + '">';
							reverse.comments += actions[j].name;
							reverse.comments += '</span>';
						}
						else {
							reverse.others = '&middot;';
							reverse.others += ' <a post_id="' + feed_items[i].id + '" href="' + actions[j].link + '" class="action-' + actions[j].name.toLowerCase() + '">';
							reverse.others += actions[j].name;
							reverse.others += '</a>';
						}
					}
					
					data.actions += reverse.likes;
					data.actions += reverse.comments;
					data.actions += reverse.others;
				} 
				
				data.to_user = '';
				
				if (feed_items[i].to && feed_items[i].to.data.length > 0 && feed_items[i].to.data[0]) {
					data.to_id = feed_items[i].to.data[0].id;
					data.to_name = feed_items[i].to.data[0].name;
					
					var to_template = '<span class="i i-to">&gt;</span> <a href="http://www.facebook.com/profile.php?id={to_id}">{to_name}</a>';
					
					data.to_user = to_template.substitute(data);
				}
				
				// News feed item-specific fields
				switch(type) {
					case 'status':
						if(feed_items[i].description) {
							data.description = '<div class="attachment clearfix">';
							data.description += '<p class="description">' + Util.linkify(feed_items[i].description) + '</p>';
							data.description += '</div>';
						}
						break;
					
					case 'link':
						if (data.story && (data.story.contains('subscribed to updates from') || data.story.contains('now friends with')|| data.story.contains('changed their profile pictures'))) {
							data.attachment_class = 'noattachment';
							break;
						}
						data.caption = feed_items[i].caption;
						data.description = feed_items[i].description;
						data.link_href = feed_items[i].link;
						data.link_name = feed_items[i].name;
						data.link_picture = feed_items[i].picture
						
						var picture_template = '<a class="link_picture" href="{link_href}"><img src="{link_picture}" /></a>';
						data.picture = feed_items[i].picture ? picture_template.substitute(data) : '';
						
						if(!feed_items[i].picture) {
							data.attachment_class = 'nomedia';
						}
						
						data.properties = '';
						if(feed_items[i].properties) {
							for(var k = 0; k < feed_items[i].properties.length; k++) {
								data.properties += feed_items[i].properties[k].text;
								if(k + 1 < feed_items[i].properties.length) {
									data.properties += '<br />';
								}
							}
						}
						break;
					
					case 'video':
						data.caption = feed_items[i].caption;
						data.video_link = feed_items[i].link;
						data.video_name = feed_items[i].name;
						data.video_thumb = feed_items[i].picture;
						
						var picture_template = '<a class="video_picture" href="{video_link}"><img src="{video_thumb}" /></a>';
						data.video_picture = feed_items[i].picture ? picture_template.substitute(data) : '';
						
						data.video_source = feed_items[i].source;
						data.description = feed_items[i].description;
						break;
					
					case 'photo':
						data.caption = feed_items[i].caption;
						data.photo_link = feed_items[i].link;
						data.photo_name = feed_items[i].name;
						data.photo_picture = feed_items[i].picture;
						
						if(!feed_items[i].picture) {
							data.attachment_class = 'nomedia';
						}
						
						data.properties = '';
						if(feed_items[i].properties) {
							data.properties += '<dl>';
							
							for(var k = 0; k < feed_items[i].properties.length; k++) {
								data.properties += '<dt>' + feed_items[i].properties[k].name + ':</dt>';
								data.properties += '<dd>';
								
								if(feed_items[i].properties[k].href) {
									data.properties += '<a href="' + feed_items[i].properties[k].href + '">';
									data.properties += feed_items[i].properties[k].text;
									data.properties += '</a>';
								}
								else {
									data.properties += feed_items[i].properties[k].text;
								}
								
								data.properties += '</dd>';
							}
							
							data.properties += '</dl>';
						}
						break;
					   
				}
				// Comments
				data.comments = this._build_comments(feed_items[i]);
				
				// Apply the template
				newsfeedItem = newsfeedItem.substitute(data);

				data.attachment_class = data.attachment_class?data.attachment_class:'';	
				// Add to list                    
				ul.grab(new Element('li', {
						html: newsfeedItem,
						id: 'nf_' + feed_items[i].id,
						class: 'nf clearfix nf_type_' + feed_items[i].type + ' ' + data.attachment_class
					})
				);                    
			}
		}
		
		return ul;
	
	},
	/**
	 * Add event listeners to the content elements
	 */
	apply_content_events: function(content) {
		if (!content) content = this.controller.content;
		// attach calls to action links
		var like_links = content.getElements('.action-like');
		like_links.each(function(el) {
			if(el.get('text').trim() == 'Like')
				el.addEvent('click', this.controller.add_like.bind(this.controller, el.getProperty('post_id')));
			else
				el.addEvent('click', this.controller.remove_like.bind(this.controller, el.getProperty('post_id')));
		}.bind(this));
		
		// add handler to bling
		
		var bling_links = content.getElements('.bling');
		bling_links.each(function(el) {
			new BlingSnippet(el.getProperty('id'), el.getProperty('post_id'), el.getProperty('like_count'), el.getProperty('comment_count'));
		});
		
		var comment_links = content.getElements('.action-comment');
		comment_links.each(function(el) {
			new CommentSnippet(el, el.getProperty('post_id'), this.controller);
		}.bind(this));
		
		content.getElements('.user_pic').addEvent('error', function() {
			this.setProperty('src', 'img/avatar.png');
		});
		
	},
	/**
	 * Build story items in the newsfeed
	 */
	build_story: function(story_text, story_tags) {
		var story = {
			text: story_text,
			pictures: ''
		};
		var replace_text = '';
		Object.each(story_tags, function(item, key) {	
			// Generate pictures
			if (key > 0) {
				for (var i = 0; i < item.length; i++) {
					story.pictures += '<a href="http://www.facebook.com/'+item[i].id+'"><img src="http://graph.facebook.com/'+item[i].id+'/picture" class="user_pic" alt="'+item[i].name+'" /></a>';
				}
				replace_text = '<a href="http://www.facebook.com/'+item[0].id+'">'+item[0].name+'</a>';
			}
			else {
				replace_text = '<a href="http://www.facebook.com/'+item[0].id+'" class="story_owner">'+item[0].name+'</a>';
			}
			// Add links to items
			story.text = story.text.replace(item[0].name, replace_text);
			
		});
		return story;
	},
	/**
	 * Build comments in the newsfeed
	 */
	_build_comments: function(item) {
		var comment_ul = '';
		   
		if(item.likes && item.likes.count > 0) {
			comment_ul = '<ul class="comments" post_id="' + item.id + '">';
			comment_ul += '<li class="comment_nub"><span class="i i-nub"></span></li>'
			
			comment_ul += '<li class="likes_count"><span class="i i-like"></span><span class="like_msg">';
			comment_ul += item.likes.count.format();
			comment_ul += ' ' + (item.likes.count == 1 ? 'person likes' : 'people like') + ' this.</span></li>';
		}
		
		if(item.comments && item.comments.count > 0) {
			if(comment_ul == '') {
				// hasn't been started yet, start the ul
				comment_ul = '<ul class="comments" post_id="' + item.id + '">';
				comment_ul += '<li class="comment_nub"><span class="i i-nub"></span></li>'
			}
			
			if(item.comments.count > 20) {
				comment_ul += '<li class="view_all"><span class="i i-comment"></span>View all <span class="comment_msg">' + item.comments.count.format() + '</span> comments on Facebook</li>';
			}
			else if(item.comments.data && item.comments.data.length < item.comments.count) {
				comment_ul += '<li class="view_all"><span class="i i-comment"></span>Show all <span class="comment_msg">' + item.comments.count.format() + '</span> comments</li>';
			}
			
			if (item.comments.data) {
				comment_ul += Util.build_comments(item.comments.data);
			}
		}
		
		if(comment_ul != '') {
			//var user = this.controller.get_user();
			
			// add the comment form
			comment_ul += '<li class="form clearfix">';
				comment_ul += '<form class="comment_form">';
					comment_ul += '<input type="hidden" name="post_id" value="' + item.id + '" />';
					comment_ul += '<div class="user_thumb"><img src="' + this.controller.get_user_picture() + '" /></div>';
					comment_ul += '<div class="textarea_wrap">';
						comment_ul += '<textarea name="comment" placeholder="Write a comment..."></textarea>';
					comment_ul += '</div>';
				comment_ul += '</form>';
			comment_ul += '</li>';
			
			comment_ul += '</ul>';
		}
		
		return comment_ul;
	},
	/**
	 * Trigger the loading animation
	 */
	load_more_content: function() {
		var more_button = $(MORE.NEWS_FEED);
		more_button.addClass('hide');
		new Element('div').addClass('more-loading').inject(more_button, 'before');
		this.controller.fetch_more_content(more_button.getProperty('more'));		
	},
	/**
	 * Infinite scrolling event
	 * (to be applied to the scroll event listener)
	 */	
	infinite_scrolling: function() {
		var more_button = $(MORE.NEWS_FEED);
		if (!more_button || more_button.hasClass('hide') || more_button.getPrevious('.more-loading')) {
			return false;
		}
		if (more_button.getPosition().y < 600) {
			this.load_more_content();
		}
	},
	
	/**
	 * Cycle through likes and determine if logged in user has liked the item
	 * @param likes Array
	 */
	_does_user_like: function(likes) {
		if(!likes.data)
			return false;
		
		var user = this.controller.get_user();
		
		if (!user) {
			new LoginController();
			return false;
		}
		
		for (var i = 0; i < likes.data.length; i++) {
			if (user.id == likes.data[i].id)
				return true;
		}
		
		return false;
	}
});