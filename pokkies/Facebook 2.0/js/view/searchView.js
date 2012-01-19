/**
 * Facebook Pokki / searchView.js
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
var SearchView = new Class({
	Extends: BaseView,
	/**
	 * Initialization
	 * @param controller	instance	the search controller
	 */
	initialize: function(controller) {
	
		this.controller = controller;

		this.main = $(MAIN.SEARCH_RESULTS);
		this.content_id = CONTENT.SEARCH_RESULTS;
		this.content = $(this.content_id);

		this.query = this.controller.query;
		this.content.empty();
		this.new_results = new Element('div', {class: 'results'});
		this.section_nav = new Element('ul', {class: 'section_nav'});
		this.results_limit = 10;
		
		this.result_type = new Array();
		this.result_type['friends'] = 'Friends';
		this.result_type['user'] = 'People';
		this.result_type['page'] = 'Pages';
		this.result_type['place'] = 'Places';
		this.result_type['group'] = 'Groups';
		
		$$(CONTENT.NAV_MENU_ITEMS).each(function(tab) { tab.fireEvent('hide'); });
		if(PERM_Controller) PERM_Controller.hide();
		$(CONTENT.WRAPPER).removeClass('sub');
		
		this.main.getElement('.content').removeEvent('scroll').addEvent('scroll', this.update_section_nav.bind(this));

		this.transition_content();
		
		GA.trackPageView('/search');
	},
	
	/**
	 * Generate and populate the Search view
	 */ 
	populate_template: function() {
   
		this.content_scroller = new Fx.Scroll(this.main.getElement('.content'));
		this.content.addClass('active').grab(this.new_results);
				
		// Create view more link
		var div = new Element('div', {
			id: MORE.SEARCH_RESULTS,
			class: 'paging-more',
			html: '<strong>See More Results for '+this.query+'</strong>',
			events: {
				click: function() {
					GA.trackPageView('/search/all_results/external');
					pokki.openURLInDefaultBrowser('http://www.facebook.com/search.php?q='+this.query);
					pokki.closePopup();
				}.bind(this)
			}
		});
		
		this.new_results.grab(this.section_nav);
		this.new_results.grab(div);
	},
	/**
	 * Append each result type
	 */ 
	add_results: function(type, data) {
		// if no results
		if (data.length <= 0) {			
			return false;
		} else if (data.length > this.results_limit) {
			data.length = this.results_limit;
		}
		
		// get the appropriate template
		var template = $('search_'+type+'_template').innerHTML;

		// setup new container
		var ul = this.new_results.getFirst('.srList_'+type);
	   	if (ul === null) {
	   		var title = this.result_type[type];
	   		var heading = new Element('div', { id: 'srHeading_'+type, class: 'srHeading '+type, html: title, 'type': type });
			ul = new Element('ul', { class: 'srList srList_'+type+' animate' });    		
			ul.inject(this.main.getElement('.paging-more'), 'before');
			heading.inject(ul, 'before');
			
			// Add the type item to the section nav
			var type_nav_item = new Element('li', {
				id: 'type_nav_'+type,
				class: 'section_nav_item animate',
				html: title,
				events: {'click': (function() { this.content_scroller.toElement('srHeading_'+type); }).bind(this)}
			});
			this.main.getElement('.section_nav').grab(type_nav_item);
			(function() { type_nav_item.removeClass('animate'); }).delay(10, this);
		} else {
			ul.empty();
		}
		
		for (var i = 0; i < data.length; i++) {
			this.map_data_to_template(type, data[i], template, ul);
		}
		(function() { ul.removeClass('animate'); this.update_section_nav(); }).delay(10, this);
	},
	/**
	 * Map search result data to the template
	 */ 
	map_data_to_template: function(type, data, template, ul) {
	
		// prepare the data
		var item_data = {};
		switch(type) {    	
		case 'page':
			item_data.page_id = data.id;
			item_data.page_name = data.name;
			item_data.page_category = data.category;
			item_data.page_image = 'http://graph.facebook.com/' + data.id + '/picture';
			item_data.click_to = 'http://www.facebook.com/' + data.id;
			break;
		case 'group':
			item_data.group_id = data.id;
			item_data.group_name = data.name;
			item_data.group_image = 'http://graph.facebook.com/' + data.id + '/picture';
			item_data.click_to = 'http://www.facebook.com/' + data.id;
			break;
		case 'place':
			item_data.place_id = data.id;
			item_data.place_name = data.name;
			item_data.place_image = 'http://graph.facebook.com/' + data.id + '/picture';
			item_data.place_category = data.category;
			item_data.click_to = 'http://www.facebook.com/' + data.id;
			if (data.location.street) {
				item_data.place_location = '&middot ';
				item_data.place_location += (data.location.street && data.location.city)?data.location.street+', '+data.location.city:data.location.street;
				item_data.place_location += (data.location.state)?', '+data.location.state:'';
			} else {
				item_data.place_location = '';
			}
			break;
		default:
			item_data.user_id = data.id;
			item_data.user_name = data.name;
			item_data.user_image = 'http://graph.facebook.com/' + data.id + '/picture';
			item_data.click_to = 'http://www.facebook.com/' + data.id;
		}
   
		// put into the template
		var item = template.substitute(item_data);
		// add to the ul
		ul.grab(new Element('li', {
			html: item,
			id: 'sr_'+type+'_' + data.id,
			class: 'clearfix ',
			click_to: item_data.click_to,
			events: {
				click: function() {
					GA.trackPageView('/search/result/'+type+'/external');
					pokki.openURLInDefaultBrowser(this.getProperty('click_to'));
					pokki.closePopup();
				}
			}
		}));
		
	},
	/**
	 * Handle no results
	 */ 
	load_no_results: function() {
		if (!this.new_results.getElement('.srList') && !this.new_results.getElement('.no_results')) {
			var no_results = new Element('div', {
				class: 'no_results animate',
				html: '<strong>No results found</strong><span>Check your spelling or try another term.</span>'
			});
			no_results.inject(this.new_results.getElement('.paging-more'), 'before');
			
			(function() { no_results.removeClass('animate'); }).delay(10, this);
		}
	},
	/**
	 * Append new result type to the section nav
	 */ 
	update_section_nav: function() {
		var currentType = false;
		this.main.getElements('.srHeading').each(function(heading) {
			if (heading.getPosition().y < 40) {
				currentType = heading.getAttribute('type');
			}
		});
		if (!currentType) return false;
		this.main.getElements('.section_nav .section_nav_item.active').removeClass('active');
		this.main.getElement('#type_nav_'+currentType).addClass('active');
	}
	
	
	
});