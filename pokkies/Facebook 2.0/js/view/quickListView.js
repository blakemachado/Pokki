/**
 * Facebook Pokki / quickListView.js
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * Note: needs to be updated to use LocalStore class for consistency
 *
 * @version     2.1.0
 * @license     MIT License
 * @author      Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */
var QuickListView = new Class({
	/**
	 * Initialization
	 * @param list_data	object		data to be displayed in the quicklist
	 * @param pane_id	id			unique id for the quicklist element
	 * @param trigger	element		the element that opens the quick list
	 */
	initialize: function(list_data, pane_id, trigger) {
		
		this.pane_id = false;
		this.new_pane = false;
		this.old_pane = false;
		this.content = false;
		
		if (pane_id) this.pane_id = pane_id;

		this.already_opened = false;
		this.list_data = list_data;
		this.trigger = trigger;
		
		this.event_position = 0;
			
		if (DEBUG)
			console.log('QUICKLIST', this.list_data, this.pane_id);
		
		console.log(this.pane_id);
		if ($(this.pane_id)) {
			this.already_opened = true;
			return false;
		}
		
		this.transition_pane();
	},
	
	/**
	 * Create the quicklist pane
	 */ 
	create_pane: function() {
		// setup new pane structure
		this.new_pane = new Element('div',{
			id: this.pane_id,
			class: 'quicklist switch'
			});
		this.content = new Element('div', {
			class: 'content'
			});
		this.new_pane.grab(this.content);
		this.new_pane.inject($('close_pokki'), 'before');
		this.populate_pane();
	},
	
	/**
	 * Generate the html content from the data
	 */ 
	populate_pane: function() {
		// get the appropriate template
		var template = $('quicklist_user_template').innerHTML;
		// setup new list container
		var ul = new Element('ul', { class: 'qkList qkList_user animate' });
		
		var item_data = {};
		var ul_innerhtml = '';
		for (var i = 0; i < this.list_data.length; i++) {
		
			// format the data
			item_data.user_id = this.list_data[i].id;
			item_data.user_name = this.list_data[i].name;
			item_data.user_image = 'http://graph.facebook.com/' + this.list_data[i].id + '/picture';
			item_data.href = 'http://www.facebook.com/' + this.list_data[i].id;
			
			// add to the ul innerhtml
			// I found it more optimized to process as string rather than li elements
			ul_innerhtml += '<li id="ql_user_'+item_data.user_id+'" class="clearfix">'+template.substitute(item_data)+'</li>';
		}
		ul.set('html', ul_innerhtml);
		this.content.grab(ul);
		this.show_pane();
	},
	
	/**
 	 * Display the quicklist pane
 	 */ 
	show_pane: function() {
		(function() {
			this.new_pane.removeClass('switch');
		}).delay(100,this);
		$$('#side, .main, .sub-main').addEvent('click', (function() {
			this.hide_pane();
		}).bind(this));
		this.trigger.addClass('selected');
		this.already_opened = true;
	},
	/**
	 * Hide and remove the quicklist pane
	 */ 	
	hide_pane: function() {
		this.old_pane = $$('.quicklist');
		if (this.old_pane) {
			this.old_pane.addClass('switch');
			(function() {
				this.old_pane.destroy();
			}).delay(500, this);
		}
		this.trigger.removeClass('selected');
		this.already_opened = false;
	},
	/**
	 * Transition in-between two quicklist panes
	 * @param no_transition		boolean		whether to animate the transition
	 */ 	
	transition_pane: function(no_transition) {
		// Remove previous results
		if (no_transition) {
			this.content.empty();
			this.populate_pane();
		} else {
			this.hide_pane();
			this.create_pane();
		}
	},
});