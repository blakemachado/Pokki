/**
 * Facebook Pokki / commentSnippet.js - Manages the comments list and posting
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */
 
var CommentSnippet = new Class({
    Implements: Events,
    
    /**
     * Initialization
     * @param comment_link  Element     The "Comment" link below the newsfeed post
     * @param post_id       String      The id of the newsfeed post
     * @param controller    Object      An instance of the controller that will handle submitting
     */ 
    initialize: function(comment_link, post_id, controller) {
        this.link = $(comment_link);
        this.post_id = post_id;
        this.controller = controller;
        this.nf_content = this.link.getParent('div.nf_content');
        this.comments_list = this.nf_content.getElement('ul.comments');
        this.bling =  $('bling-' + this.post_id);
        
        // comment form, if present
        this.comment_form = this.nf_content.getElement('.comment_form');
        if(this.comment_form) {
            this.comment_form.addEvent('submit', this.submit_comment.bind(this));
            this.comment_form.comment.setStyle('height', 14);
            this.comment_form.comment.addEvents({
                focus: this.focus_textarea.bind(this),
                blur: this.blur_textarea.bind(this),
                keydown: this.listen_textarea.bind(this)
            });
        }
        
        // dummy comment div for autogrow
        this.dummy_div = $('dummy_div');
        
        // add link events
        this.link.addEvent('click', this.add_comment.bind(this));
        
        // add event to view all, if present
        this.view_all = this.nf_content.getElement('.view_all');
        if(this.view_all) {
            this.view_all.addEvent('click', this.expand_comments.bind(this));
        }
        
        // add bling listener
        if(this.bling) {
            this.bling.addEvent('updated', this.bling_listener.bind(this));
        }
    },
    
    /**
     * Bound to the bling div to update text within the comments list when things are updated
     * @param values    Object  {likes: #, comments: #} Current count of likes and comments
     */
    bling_listener: function(values) {
        if(this.comments_list) {
            // update comment message
            var cmsg = this.comments_list.getElement('.comment_msg');
            if(cmsg)
                cmsg.set('text', values.comments.format());
                
            // update likes message
            var lmsg = this.comments_list.getElement('.like_msg');
            if(lmsg) {
                if(values.likes > 0)
                    lmsg.set('text', values.likes.format() + (values.likes == 1 ? ' person likes' : ' people like') + ' this.');
                else if(this.comments_list.getElement('li.likes_count'))
                    this.comments_list.getElement('li.likes_count').destroy();
            }
            else if(values.likes > 0) {
                var like_block = this._build_likes_block();
                this.comments_list.getElement('li.comment_nub').grab(like_block, 'after');
            }
        }
        else {
            this._build_comments_list();
            this._build_comment_form();
        }
    },
    
    /**
     * onClick handler for 'Comment' link
     */
    add_comment: function(e) {
        // Build the comment form if it has not been started yet
        if(! this.comment_form) {
            if(! this.comments_list) {
                this._build_comments_list();
            }
            
            this._build_comment_form();
        }
        // Bring focus to textarea
        this.comment_form.comment.focus();
    },
    
    /**
     * Calls the controller to send the data
     */
    submit_comment: function() {
        if(DEBUG) console.log('[SUBMIT COMMENT]');
        
        this.controller.add_comment(
            this.post_id,
            this.comment_form.comment.value,
            this.submit_callback.bind(this)
        );
    },
    
    /**
     * Post comment-submitted actions
     */
    submit_callback: function(resp) {
        if(DEBUG) console.log('[SUBMIT COMMENT CALLBACK]', resp);
        
        if(! resp.error_code) {
            var user = this.controller.get_user();
            var comment_template = $('newsfeed_comment_template').innerHTML;
            var comment_data = {
                user_url: user.link,
                user_image: 'http://graph.facebook.com/' + user.id + '/picture',
                user_name: user.name,
                id: resp.comment_id,
                comment: this.comment_form.comment.value,
                time: '2 seconds ago',
                actions: ''
            };
            
            var li = new Element('li', {
                class: 'cmt clearfix',
                id: 'cmt-' + resp.comment_id,
                html: comment_template.substitute(comment_data)
            });
            
            this.comments_list.getElement('li.form').grab(li, 'before');
            this.comment_form.reset();
            
            if(this.bling)
                this.bling.fireEvent('comment_up');
            
            // Tracking
            GA.trackPageView('/' + this.controller.tab.id + '/comment');
        }
        else if(resp.error_code == 200) {
            // user didn't allow publish_stream, message accordingly
            PERM_Controller = new PermissionsController($(CONTENT.MAIN));
        }
        else {
            if(DEBUG) console.log(resp.error_msg);
            
            var err = new Element('span', {
                class: 'error',
                html: 'Sorry, there was a problem posting to Facebook.'
            });
            this.comment_form.grab(err, 'bottom');
            this.comment_form.comment.set('value', this.comment_form.comment.get('value').replace(/(\r\n|[\r\n])/g, ''));
        }
    },
    
    /**
     * Listens for enter key to submit form and autogrows textarea height
     */
    listen_textarea: function(e) {
        this.expand_textarea();
        
        if(e.key == 'enter') {
            e.stop();
            
            var err = this.comment_form.getElement('span.error');
            if(err) err.destroy();
            
            if(this.comment_form.comment.get('value').trim() != '')
                this.submit_comment();
                
            return false;
        }
        return true;
    },
    
    /**
     * onFocus event for textarea
     */
    focus_textarea: function(event) {
        this.comment_form.addClass('open');
    },
    
    /**
     * onBlur event for textarea
     */
    blur_textarea: function() {
        if(this.comment_form.comment.get('value').trim() == '') {
            this.comment_form.removeClass('open');
            this.comment_form.reset();
            this.comment_form.comment.tween('height', 14);
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
            }).setStyles(this.comment_form.comment.getStyles("font-size", "font-family", "width", "line-height", "padding")).inject(document.body);
            this.dummy_div.setStyle('width', this.dummy_div.getSize().x - 10);
        }
        
        this.dummy_div.set('html', this.comment_form.comment.get('value'));
        var dummyHeight = this.dummy_div.getSize().y;
        if(this.comment_form.comment.clientHeight != dummyHeight) {
            var newHeight = Math.max(14, dummyHeight);
            this.comment_form.comment.set('tween', {
                duration: '180ms',
                link: 'ignore',
                transition: 'linear'
            });
            this.comment_form.comment.tween('height', newHeight);
        }
    },
    
    /**
     * View all click handler
     **/
    expand_comments: function() {
        var cmsg = this.comments_list.getElement('.comment_msg');
        if(cmsg) {
            var count = cmsg.innerHTML.toInt();
            
            if(count > 20) {
                // Tracking
                GA.trackPageView('/' + window.localStorage.getItem(KEYS.ACTIVE_TAB) + '/external');
                
                // Link to post
                var parts = this.post_id.split('_');
                var url = 'http://www.facebook.com/' + parts[0] + '/posts/' + parts[1];
                pokki.openURLInDefaultBrowser(url);
                pokki.closePopup();
            }
            else {
                // fetch and expand comments
                this.fetch_comments(this.populate_comments.bind(this));
            }
        }
    },
    
    /**
     * Makes the call to grab comments for this post
     */
    fetch_comments: function(callback) {
        var r = new Request.JSONP({
            url: 'https://graph.facebook.com/' + this.post_id,
            data: {
                access_token: this.controller.get_access_token()
            },
            onComplete: callback
        }).send();
    },
    
    /**
     * Callback for expanding 'view all' of comments
     **/
    populate_comments: function(resp) {
        if( ! resp.error && resp.comments && resp.comments.data) {
            var comments = resp.comments;
            var comments_string = Util.build_comments(comments.data);
            var dummy = new Element('div', {html: comments_string});
            var comment_lis = dummy.getElements('li');
            
            this.comments_list.getElement('.view_all').destroy();
            this.comments_list.getElements('.cmt').destroy();
            
            var form_li = this.comments_list.getElement('li.form');
            comment_lis.inject(form_li, 'before');
            
            dummy.destroy();
        } 
    },
    
    /**
     * Callback for expanding entire comments block if was hidden previously...
     * possibly unnecessary now because we no longer display only the bling without a comment block
     **/
    populate_latest_comments: function(resp) {
        if( ! resp.error && resp.comments && resp.comments.data) {
            var comments = resp.comments;
            
            if(comments.data.length > 3) {
                var comments_string = Util.build_comments(comments.data.slice(-3));
            }
            else {
                var comments_string = Util.build_comments(comments.data);
            }
            
            var dummy = new Element('div', {html: comments_string});
            var comment_lis = dummy.getElements('li');
            
            var form_li = this.comments_list.getElement('li.form');
            comment_lis.inject(form_li, 'before');
            
            dummy.destroy();
            
            this.comments_list.show();
        } 
    },
    
    /**
     * Constructs the "# people like this" <li>
     */
    _build_likes_block: function() {
        var num_likes = this.bling.getProperty('like_count').toInt();
        var likes_li = new Element('li', {
            class: 'likes_count',
            html: '<span class="i i-like"></span><span class="like_msg">' + num_likes.format() + ' ' + (num_likes == 1 ? 'person likes' : 'people like') + ' this.</span></li>'
        });
        
        return likes_li;
    },
    
    /**
     * Initializes list of comments if not already present
     */
    _build_comments_list: function() {
        this.comments_list = new Element('ul', {
            class: 'comments',
            html: '<li class="comment_nub"><span class="i i-nub"></span></li>',
            styles: {
                display: 'none'
            }
        });
        
        if(this.bling) {
            var num_comments = this.bling.getProperty('comment_count').toInt();
            var num_likes = this.bling.getProperty('like_count').toInt();
            
            // Likes information block
            if(num_likes > 0) {
                this.comments_list.grab(this._build_likes_block());
            }
            
            // Comments view all block
            if(num_comments > 3) {
                if(num_comments > 20) {
                    var viewall = '<span class="i i-comment"></span>View all <span class="comment_msg">' + num_comments.format() + '</span> comments on Facebook';
                }
                else {
                    var viewall = '<span class="i i-comment"></span>Show all <span class="comment_msg">' + num_comments.format() + '</span> comments';
                }
                
                this.view_all = new Element('li', {
                    class: 'view_all',
                    html: viewall,
                    events: {
                        click: this.expand_comments.bind(this)
                    }
                });
                
                this.comments_list.grab(this.view_all);
            }
            
            // Latest few comments
            if(num_comments > 0) {
                // will display list of comments after populated
                this.fetch_comments(this.populate_latest_comments.bind(this));
            }
            else {
                // display list, not waiting for content to load
                this.comments_list.show();
            }
        }
        
        this.nf_content.grab(this.comments_list);
    },
    
    /**
     * Initializes comment form if not present already
     **/
    _build_comment_form: function() {
        var user = this.controller.get_user();
        
        this.comment_form = new Element('form', {
            class: 'comment_form'
        });
        
        this.comment_form.grab(new Element('input', {
            type: 'hidden',
            name: 'post_id',
            value: this.post_id
        }));
        
        this.comment_form.grab(new Element('div', {
            class: 'user_thumb',
            html: '<img src="' + 'http://graph.facebook.com/' + user.id + '/picture" />'
        }));
        
        this.comment_form.grab(
            (new Element('div',
                {
                    class: 'textarea_wrap'
                })
            ).grab(
                new Element('textarea',
                    {
                        name: 'comment',
                        placeholder: 'Write a comment...',
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
        
        var form_li = new Element('li', {
            class: 'form clearfix'
        });
        form_li.grab(this.comment_form);
        
        this.comments_list.grab(form_li);
    }
});