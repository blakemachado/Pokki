/**
 * Facebook Pokki / newsFeedView.js
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
 
var NewsFeedView = new Class({
    Extends: BaseView,
    
    /**
     * Initialization (see BaseView class)
     */
    initialize: function(data, controller, no_transition) {
        this.parent(data, controller, no_transition);
        
        if(DEBUG) {
            console.log('[NEWSFEED DATA]', data);
        }
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
        
        var user = this.controller.get_user();
        form.grab(new Element('div', {
            class: 'user_thumb',
            html: '<img src="' + 'http://graph.facebook.com/' + user.id + '/picture" />'
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
            
            // Tracking
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
            PERM_Controller = new PermissionsController($(CONTENT.MAIN));
        }
    },
    
    /**
     * Autogrower for textarea
     */
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
        if(!$('status_updater')) {
            this.controller.content.grab(this.status_update_form(), 'top');
        }
        
        var template = '';
        var newsfeedItem = '';
        var type = '';
        var data = {};
        
        // setup new container
        var new_results = new Element('div', {class: 'results'});
        var ul = new Element('ul', {
            class: 'nfList' + (no_transition ? ' no_animate' : ' animate')
        });
        
        if(this.data.length > 0) {
            // timer for animation
            var duration = 200;
            
            for(var i = 0; i < this.data.length; i++) {
                if(duration > 1000)
                    duration = 200;
                else
                    duration = duration + 130;
                
                type = this.data[i].type;
                template = $('newsfeed_' + type + '_template');
                if(template) {
                    newsfeedItem = $(template).innerHTML;
                    data = {};
                    data.user_image = 'http://graph.facebook.com/' + this.data[i].from.id + '/picture';
                    data.user_id = this.data[i].from.id;
                    data.user_name = this.data[i].from.name;
                    data.type = this.data[i].type;
                    data.time = new Date().parse(this.data[i].created_time).timeDiffInWords();
                    data.icon = this.data[i].icon ? '<img src="' + this.data[i].icon + '" />' : '';
                    data.message = Util.linkify(this.data[i].message);
                                
                    var item_id = this.data[i].id.split('_');
                    var item_url = 'http://www.facebook.com/' + item_id[0] + '/posts/' + item_id[1];
                    data.item_url = item_url;
                    
                    // Action Links
                    var actions = this.data[i].actions;
                    data.actions = '';
                    
                    if(actions) {
                        var add_dot = false;
                        var bling = '';
                        var user_likes = this.data[i].likes ? this._does_user_like(this.data[i].likes) : false;
                        
                        // Bling block - disabled, just here for updating counts and such
                        //bling += '<span id="bling-' + this.data[i].id + '-dot">&middot;</span>';
                        bling += '<a id="bling-' + this.data[i].id + '" post_id="' + this.data[i].id + '" class="bling disabled" href="' + item_url + '" like_count="' + (this.data[i].likes ? this.data[i].likes.count : 0) + '" comment_count="' + (this.data[i].comments ? this.data[i].comments.count : 0) + '">';
                            bling += '<span id="like_bling-' + this.data[i].id + '" class="like_bling"><span class="i i-like"></span><span class="like_counter">' + (this.data[i].likes ? this.data[i].likes.count.format() : 0) + '</span></span>';
                            bling += '<span id="comment_bling-' + this.data[i].id + '" class="comment_bling"><span class="i i-comment"></span><span class="comment_counter">' + (this.data[i].comments ? this.data[i].comments.count.format() : 0) + '</span></span>';
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
                                reverse.likes = '&middot;';
                                reverse.likes += ' <span id="' + actions[j].name.toLowerCase() + '-' + this.data[i].id + '" post_id="' + this.data[i].id + '" class="act action-' + actions[j].name.toLowerCase() + '">';
                                reverse.likes += user_likes ? 'Unlike' : 'Like';
                                reverse.likes += '</span>';
                            }
                            else if('Comment' == actions[j].name) {
                                reverse.comments = '&middot;';
                                reverse.comments += ' <span id="' + actions[j].name.toLowerCase() + '-' + this.data[i].id + '" post_id="' + this.data[i].id + '" class="act action-' + actions[j].name.toLowerCase() + '">';
                                reverse.comments += actions[j].name;
                                reverse.comments += '</span>';
                            }
                            else {
                                reverse.others = '&middot;';
                                reverse.others += ' <a post_id="' + this.data[i].id + '" href="' + actions[j].link + '" class="action-' + actions[j].name.toLowerCase() + '">';
                                reverse.others += actions[j].name;
                                reverse.others += '</a>';
                            }
                        }
                        
                        data.actions += reverse.likes;
                        data.actions += reverse.comments;
                        data.actions += reverse.others;
                    }
                    
                    data.to_user = '';
                    if(this.data[i].to && this.data[i].to.data.length > 0) {
                        data.to_id = this.data[i].to.data[0].id;
                        data.to_name = this.data[i].to.data[0].name;
                        
                        var to_template = '<span class="i i-to">&gt;</span> ';
                        to_template += '<a href="http://www.facebook.com/profile.php?id={to_id}">{to_name}</a>';
                        
                        data.to_user = to_template.substitute(data);
                    }
                    
                    // News feed item-specific fields
                    switch(type) {
                        case 'status':
                            if(this.data[i].description) {
                                data.description = '<div class="attachment clearfix">';
                                data.description += '<p class="description">' + Util.linkify(this.data[i].description) + '</p>';
                                data.description += '</div>';
                            }
                            break;
                        
                        case 'link':
                            data.caption = this.data[i].caption;
                            data.description = this.data[i].description;
                            data.link_href = this.data[i].link;
                            data.link_name = this.data[i].name;
                            data.link_picture = this.data[i].picture
                            
                            var picture_template = '<a class="link_picture" href="{link_href}"><img src="{link_picture}" /></a>';
                            data.picture = this.data[i].picture ? picture_template.substitute(data) : '';
                            
                            if(!this.data[i].picture) {
                                data.attachment_class = 'nomedia';
                            }
                            
                            data.properties = '';
                            if(this.data[i].properties) {
                                for(var k = 0; k < this.data[i].properties.length; k++) {
                                    data.properties += this.data[i].properties[k].text;
                                    if(k + 1 < this.data[i].properties.length) {
                                        data.properties += '<br />';
                                    }
                                }
                            }
                            break;
                        
                        case 'video':
                            data.caption = this.data[i].caption;
                            data.video_link = this.data[i].link;
                            data.video_name = this.data[i].name;
                            data.video_thumb = this.data[i].picture;
                            
                            var picture_template = '<a class="video_picture" href="{video_link}"><img src="{video_thumb}" /></a>';
                            data.video_picture = this.data[i].picture ? picture_template.substitute(data) : '';
                            
                            data.video_source = this.data[i].source;
                            data.description = this.data[i].description;
                            break;
                        
                        case 'photo':
                            data.caption = this.data[i].caption;
                            data.photo_link = this.data[i].link;
                            data.photo_name = this.data[i].name;
                            data.photo_picture = this.data[i].picture;
                            
                            data.properties = '';
                            if(this.data[i].properties) {
                                data.properties += '<dl>';
                                
                                for(var k = 0; k < this.data[i].properties.length; k++) {
                                    data.properties += '<dt>' + this.data[i].properties[k].name + ':</dt>';
                                    data.properties += '<dd>';
                                    
                                    if(this.data[i].properties[k].href) {
                                        data.properties += '<a href="' + this.data[i].properties[k].href + '">';
                                        data.properties += this.data[i].properties[k].text;
                                        data.properties += '</a>';
                                    }
                                    else {
                                        data.properties += this.data[i].properties[k].text;
                                    }
                                    
                                    data.properties += '</dd>';
                                }
                                
                                data.properties += '</dl>';
                            }
                            break;
                    }
                    
                    // Comments
                    data.comments = this._build_comments(this.data[i]);
                    
                    // Apply the template
                    newsfeedItem = newsfeedItem.substitute(data);
                    
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
                            html: newsfeedItem,
                            id: 'nf_' + this.data[i].id,
                            class: 'nf clearfix nf_type_' + this.data[i].type,
                            styles: styles
                        })
                    );
                }
            }
            
            // Create view more link
            var div = new Element('div', {
                id: MORE.NEWS_FEED,
                class: 'paging-more',
                html: '<strong>See More</strong>',
                events: {
                    click: function() {
                        GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/external');
                        pokki.openURLInDefaultBrowser('http://www.facebook.com');
                        pokki.closePopup();
                    }.bind(this)
                }
            });
            
            new_results.grab(ul);
            new_results.grab(div);
        }
        // No news feed items
        else {
            var div = new Element('div', {
                class: 'no-items news_feed',    
                html: '<img src="img/no-news_feed.png" />' +
                    'No news feed to display.'
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
        
        // attach calls to action links
        var like_links = this.controller.content.getElements('.action-like');
        like_links.each(function(el) {
            if(el.get('text').trim() == 'Like')
                el.addEvent('click', this.controller.add_like.bind(this.controller, el.getProperty('post_id')));
            else
                el.addEvent('click', this.controller.remove_like.bind(this.controller, el.getProperty('post_id')));
        }.bind(this));
        
        // add handler to bling
        var bling_links = this.controller.content.getElements('.bling');
        bling_links.each(function(el) {
            new BlingSnippet(el.getProperty('id'), el.getProperty('post_id'), el.getProperty('like_count'), el.getProperty('comment_count'));
        });
        
        var comment_links = this.controller.content.getElements('.action-comment');
        comment_links.each(function(el) {
            new CommentSnippet(el, el.getProperty('post_id'), this.controller);
        }.bind(this));
        
        ul = null;
        div = null;
        new_results = null;
    },
    
    /**
     * Build comments HTML for newsfeed item
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
            
            if(item.comments.data) {
                comment_ul += Util.build_comments(item.comments.data);
            }
        }
        
        if(comment_ul != '') {
            var user = this.controller.get_user();
            
            // add the comment form
            comment_ul += '<li class="form clearfix">';
                comment_ul += '<form class="comment_form">';
                    comment_ul += '<input type="hidden" name="post_id" value="' + item.id + '" />';
                    comment_ul += '<div class="user_thumb"><img src="' + 'http://graph.facebook.com/' + user.id + '/picture" /></div>';
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
     * Cycle through likes and determine if logged in user has liked the item
     * @param likes Array
     */
    _does_user_like: function(likes) {
        if(!likes.data)
            return false;
        
        var user = this.controller.get_user();
        
        for(var i = 0; i < likes.data.length; i++) {
            if(user.id == likes.data[i].id)
                return true;
        }
        
        return false;
    }
});