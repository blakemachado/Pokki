/**
 * Facebook Pokki / blingSnippet.js - Manages the bling icons
 * FYI, The icons for like and comment counts are no longer visible (via css) but they're still there
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */
 
var BlingSnippet = new Class({
    Implements: Events,
    
    /**
     * Manages the little thumbs up/comments bubble box counter with events triggered
     * when user likes/unlikes/comments on a newsfeed item
     * 
     * @param bling      String/Element     DOM selector for the bling box that this will support
     * @param post_id    String     ID of this post
     * @param num_likes      int        Likes count given by Facebook
     * @param num_comments   int        Comments count given by Facebook
     */
    initialize: function(bling, post_id, num_likes, num_comments) {
        this.bling = $(bling);
        this.bling_dot = $(bling + '-dot');
        this.like_bling = $('like_bling-' + post_id);
        this.comment_bling = $('comment_bling-' + post_id);
        this.post_id = post_id;
        this.num_likes = num_likes*1;
        this.num_comments = num_comments*1;
        
        this.bling.addEvents({
            'like_up': this.onLikeUp.bind(this),
            'like_down': this.onLikeDown.bind(this),
            'comment_up': this.onCommentUp.bind(this),
            'comment_down': this.onCommentDown.bind(this),
            'hide_bling': this.onHideBling.bind(this)
        });
        
        if(this.num_likes == 0 && this.num_comments == 0)
            this.hide();
        if(this.num_likes == 0)
            this.like_bling.hide();
        if(this.num_comments == 0)
            this.comment_bling.hide();
    },
    
    hide: function() {
        this.bling.hide();
        if(this.bling_dot)
            this.bling_dot.hide();
    },
    
    show: function() {
        if(! this.bling.hasClass('disabled')) {
            this.bling.show();
            if(this.bling_dot)
                this.bling_dot.show();
        }
    },
    
    onHideBling: function() {
        this.bling.addClass('disabled');
        this.hide();
    },
    
    onLikeUp: function() {
        this.num_likes = this.num_likes + 1;
        this.update_like();
    },
    
    onLikeDown: function() {
        this.num_likes = this.num_likes - 1;
        this.update_like();
    },
    
    update_like: function() {
        this.like_bling.getElement('.like_counter').set('text', this.num_likes.format());
        this.bling.setProperty('like_count', this.num_likes);
        
        if(this.num_likes > 0) {
            this.like_bling.show();
        }
        else if(this.num_likes <= 0) {
            this.num_likes = 0;
            this.like_bling.hide();
        }
        
        if(this.num_likes > 0) {
            this.show();
        }
        else if(this.num_likes == 0 && this.num_comments == 0) {
            this.hide();
        }
        
        this.bling.fireEvent('updated', {likes: this.num_likes, comments: this.num_comments});
    },
    
    onCommentUp: function() {
        this.num_comments = this.num_comments + 1;
        this.update_comments();
    },
    
    onCommentDown: function() {
        this.num_comments = this.num_comments - 1;
        this.update_comments();
    },
    
    update_comments: function() {
        this.comment_bling.getElement('.comment_counter').set('text', this.num_comments.format());
        this.bling.setProperty('comment_count', this.num_comments);
        
        if(this.num_comments > 0) {
            this.comment_bling.show();
        }
        else if(this.num_comments <= 0) {
            this.num_comments = 0;
            this.comment_bling.hide();
        }
        
        if(this.num_comments > 0) {
            this.show();
        }
        else if(this.num_comments == 0 && this.num_likes == 0) {
            this.hide();
        }
        
        this.bling.fireEvent('updated', {likes: this.num_likes, comments: this.num_comments});
    }
});