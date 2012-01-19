/**
 * Facebook Pokki / baseView.js
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     2.1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * 				Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */
 
var BaseView = new Class({
	/**
	 * Initialization
	 * @param   data        The data to populate the view with
	 * @param   controller  The controller calling creating the view
	 * @param   no_transition   Whether or not to skip the animation
	 */
	initialize: function(data, controller, no_transition) {
		this.data = data;
		this.controller = controller;
		
		this.old_container;
		this.new_container;
		
		if (no_transition) {
			this.clear_content();
		} else {
			this.transition_content();
		}		
	},	
    /**
     * Wipe out the content and populate the template without a transition
     */
	clear_content: function() {
		var prev_results = this.controller.get_results_div();
		if (prev_results)
			prev_results.destroy();
		this.populate_template(true);
		if (DEBUG) console.log('[Clear Content]', this.controller);		
	},
	/**
	 * For 1st level panes.
	 * Transition the old pane out and switch new pane in.
	 * Populate content is necessary.
	 */	
	transition_content: function(no_transition) {
		if (!this.main.getElement('.results')) {
			this.populate_template();
		}
		$$('.main').addClass('switch');
		this.main.removeClass('switch');
	},
	/**
	 * For 2nd level panes.
	 * Transition the old pane out and switch new pane in.
	 * Remove old pane on transition out.
	 * Populate content is necessary.
	 */	
	transition_subcontent: function(no_transition) {
		// Remove previous results
		if (no_transition) {
			this.content.empty();
		} else {		
			if (!this.already_open) {
				$(CONTENT.WRAPPER).addClass('sub');
			}
		}
		this.old_container = $$('.sub-main');
		this.old_container.addClass('switch');
		this.populate_template();		
		(function() {
			this.old_container.destroy();
		}).delay(500, this);
	},

    /**
     * Views that extend from this base must implement populate_template
     * Remove Splash screen if necessary
     * @param no_transition Boolean Whether or not to skip the transition
     */
	populate_template: function(no_transition) {
		if ($(CONTENT.WRAPPER).hasClass('splash')) {
			if (DEBUG) console.log('[SPLASH] Init load complete. Remove Splash'); 
			(function() {
				Util.transition_splash_out();
			}).delay(1000, this);
		}
	},	
    /**
     * 1st level views that extend from this base must implement create_new_container
     * NOT IN USE.
     * To ensure a smooth transition, all 1st level panes are present and are never destroyed
     */
	create_new_container: function() {
		// setup new main structure	
		/*	
		this.new_container = new Element('div',{
			id: 'main',
			class: 'main switch'
			});
		var new_content = new Element('div', {
			id: 'content',
			class: 'content'
			});
		var new_tab_content = new Element('div', {
			id: this.content_id,
			class: 'tab_content clearfix active'
			});
		new_content.grab(new_tab_content);
		this.new_container.grab(new_content);
		this.new_container.inject($('main-anchor'), 'before');
		this.controller.content = new_tab_content;
		(function() {
			this.new_container.removeClass('switch');
		}).delay(10,this);
		*/
	},
	
	/**
	 * 2nd level views that extend from this base must implement create_new_subcontainer
	 */
	create_new_subcontainer: function() {
		// setup new subcontent structure
		this.new_container = new Element('div',{
			id: 'sub-main',
			class: 'sub-main switch'
			});
		var new_submain_content = new Element('div', {
			class: 'content'
			});
		var new_subcontent = new Element('div', {
			id: this.content_id,
			class: 'sub_content clearfix'
			});
		new_submain_content.grab(new_subcontent);
		this.new_container.grab(new_submain_content);
		this.new_container.inject($('close_pokki'), 'before');
		this.content = new_subcontent;
		
		(function() {
			this.new_container.removeClass('switch');
		}).delay(10,this);
	},
	
	/**
	 * Closing quicklist (3rd level pane)
	 */
	close_quicklist: function() {
		var quicklist = $$('.quicklist');
		quicklist.addClass('switch');
		(function() {
			quicklist.destroy();
		}).delay(500, this);
	},
	
	/**
	 * For each controller to update cache in localStorage
	 */
	update_cache: function(key, data) {
		try {
			window.localStorage.setItem(key, data);
		}
		catch(e) {
			console.log(e);
			
			try {
				window.localStorage.removeItem(key);
				window.localStorage.setItem(key, data);
			}
			catch(e) {
				console.log(e);
			}
		}
	}
});