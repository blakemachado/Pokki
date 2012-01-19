/**
 * Facebook Pokki / snippets.js / DropdownSnippet - Manages the custom dropdown menu element
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     1.0
 * @license     MIT License
 * @author      Clement Ng <clement@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */
var DropdownSnippet = new Class({
    
    /**
     * Manages the custom dropdown select menu
     * 
     * @param dropdown_wrapper      String/Element	DOM selector for the dropdown wrapper
     * @param select_callback		function		Callback function on select
     */
    initialize: function(dropdown_wrapper, select_callback) {
        this.wrapper = dropdown_wrapper;
        this.select_button = this.wrapper.getElement('.selectButton');
        this.dropdown = this.wrapper.getElement('.dropdown');
        this.select_callback = select_callback;
        
        this.select_button.addEvent('click', (function(e) {
        	e.stop();
        	if (this.dropdown.hasClass('hide')) {
	        	this.show_dropdown();        	
	        } else {
	        	this.hide_dropdown();
	        }
        }).bind(this));

		var that = this;
    	this.dropdown.getElements('li').each(function(item, index) {
    		item.addEvent('click', that.click_dropdown_item.bind(that, item));
    	});
    },

    show_dropdown: function() {
    	this.dropdown.removeClass('hide');
    	(function() { this.dropdown.removeClass('animate'); }).delay(10, this);
    	$(document.body).addEvent('click', function () {
    		this.hide_dropdown();
    	}.bind(this));
    },
    
    hide_dropdown: function() {
    	this.dropdown.addClass('animate');
    	$(document.body).removeEvent('click');
    	(function() { this.dropdown.addClass('hide'); }).delay(220, this);
    },
    
    click_dropdown_item: function(item) {
		event.preventDefault();
		this.hide_dropdown();
		if (this.select_callback)
			this.select_callback(item);
    },
    
    update_button_text: function(text) {
    	this.select_button.set('html', '<span>'+text+'</span>');
    }
});