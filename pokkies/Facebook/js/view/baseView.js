/**
 * Facebook Pokki / baseView.js
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
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
        
        if(no_transition)
            this.clear_content();
        else
            this.transition_content();
    },
    
    /**
     * Wipe out the content and populate the template without a transition
     */
    clear_content: function() {
        var prev_results = this.controller.get_results_div();
        if(prev_results)
            prev_results.destroy();
        this.populate_template(true);
    },
    
    /**
     * Transition the old content out and tell populate to transition in content
     */
    transition_content: function() {
        var prev_results = this.controller.get_results_div();
        if(prev_results) {
            var lis = prev_results.getElements('li');
            
            if(lis.length == 1) {
                prev_results.destroy();
                this.populate_template(false);
            }
            else {
                // This animation transitions content out by pushing it to the right
                var li_count = lis.length > 10 ? 10 : lis.length;
                var duration = 100;
                for(var i = 0; i < li_count; i++) {
                    if(duration > 1000)
                        duration = 100;
                    else
                        duration = duration + 30;
                    
                    lis[i].setStyle('padding-left', 0);
                    lis[i].setStyle('margin-left', 15);
                    lis[i].setStyle('width', lis[i].getSize().x - lis[i].getStyle('padding-right').toInt());
                    lis[i].set('tween', {
                        duration: duration
                    });
                    lis[i].tween('margin-left', 100);
                }
            
                prev_results.set('morph', {
                    duration: 'short'
                });
                prev_results.morph({
                    opacity: 0,
                    marginLeft: 200
                }).get('morph').chain(
                    function() {
                        prev_results.destroy();
                        this.populate_template(false);
                    }.bind(this)
                );
            }
        }
        else {
            this.populate_template(false);
        }
    },
    
    /**
     * Views that extend from this base must implement populate_template
     * @param no_transition Boolean Whether or not to skip the transition
     */
    populate_template: function(no_transition) {
        // no default
    }
});