/**
 * Bubbles.js
 * A JavaScript framework-independent class for notification bubble(s). 
 * Animation and styling all done via CSS.
 *
 * Usage:
 * var bubble = Bubbles.createNew(bubble_id, options);
 * bubble.show(); // shows the bubble
 * bubble.dismiss(); // hides the bubble
 * bubble.remove(); // deletes instance and dom elements
 *
 * Bubbles.showAll(); // shows all bubbles that were created
 * Bubbles.dismissAll(); // hides all bubbles on screen
 *
 * @version     1.0.0
 * @license     MIT License
 * @authors     Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   Authors, 2012
 */
var Bubbles = (function (document, window) {

    "use strict";
    
    var bubblesArr = {}, // holds all bubbles
    
        $ = function (selector, context) {
            context = context || document;
            return context.querySelector(selector);
        },
        
        standardizeBubbleId = function (id) {
            return 'bb-' + id;
        },
        
        getElementDimensions = function (el) {
            return {
                width: el.offsetWidth,
                height: el.offsetHeight,
                left: el.offsetLeft,
                parent: el.offsetParent,
                top: el.offsetTop
            };
        },
        
        /**
         * Bubble Class
         * Possible properties in the options object:
         * @param id            string              unique id for this bubble, will be prepended with bb-
         * The following are options:
         * @param pinnedTo      string|element      item this bubble references, will be given a class of .bubble-active when bubble is visible
         * @param contentHTML   string              html to populate the bubble content
         * @param onShow        function            executed when bubble is displayed
         * @param onHide        function            executed when bubble is hidden
         * @param parent        string|element      dom element this bubble will be appended to
         * @param autoHide      int                 0 is default, meaning no auto hide. Otherwise, bubble will be automatically hidden after specified time.
         * @param dismissAnimationDuration  int     time in ms for bubble dismissal animation
         */
        Bubble = function (id, options) {
            options = options || {};
            options.contentHTML = options.contentHTML ? options.contentHTML : '';
            options.parent = options.parent ? (typeof(options.parent) == 'string' ? $(options.parent) : options.parent) : document.body;
            options.pinnedTo = options.pinnedTo ? (typeof(options.pinnedTo) == 'string' ? $(options.pinnedTo) : options.pinnedTo) : document.body;
            options.showDismissal = options.showDismissal === false ? false : true;
            options.autoHide = options.autoHide ? options.autoHide : 0;
            options.dismissAnimationDuration = options.dismissAnimationDuration ? options.dismissAnimationDuration : 200;
    
            var self = this,
                bubbleEl,
                closeEl,
                contentEl,
                bubbleTipEl,
                parent = options.parent,
                pinnedTo = options.pinnedTo,
                dismissTimer = 0,
                autoDismissTimer = 0,
                clickedToClose = false;            
            
            this.addCSSClass = function (cssClass) {
                if (bubbleEl) bubbleEl.classList.add(cssClass);
                return self;
            };
            
            this.removeCSSClass = function (cssClass) {
                if (bubbleEl) bubbleEl.classList.remove(cssClass);
                return self;
            };
            
            this.setContent = function (contentHTML) {
                contentEl.innerHTML = contentHTML;
                return self;
            };
            
            this.isShowing = function() {
                return bubbleEl.style.display == 'block';
            };
            
            this.show = function (mouseEvent) {
                clearTimeout(dismissTimer);
                clearTimeout(autoDismissTimer);
                
                bubbleEl.style.display = 'block';
                
                self.removeCSSClass('dismiss');
                setTimeout(function() { self.addCSSClass('active') }, 1);
                pinnedTo.classList.add('bubble-active');
                pinnedTo.classList.add('bubble-active-' + id);
                
                if (options.onShow) {
                    options.onShow();
                }
                
                // auto hide for a show without mouse interaction
                if (options.autoHide && !mouseEvent) {
                    autoDismissTimer = setTimeout(function() {
                        self.dismiss();
                    }, options.autoHide);
                }
                // auto hide for a show after mouse leaves bubble
                else if(options.autoHide && mouseEvent == 'mouseout') {
                    autoDismissTimer = setTimeout(function() {
                        self.dismiss();
                    }, options.autoHide / 2);
                }
                
                clickedToClose = false;
                
                return self;
            };
            
            this.dismiss = function (fromMouseEvent) {
                clickedToClose = fromMouseEvent; // keeps the mouseover and mouseout from unintentionally showing the bubble again
                clearTimeout(dismissTimer);
                clearTimeout(autoDismissTimer);
                
                self.removeCSSClass('active');
                self.addCSSClass('dismiss');
                dismissTimer = setTimeout(function() {
                    bubbleEl.style.display = 'none';
                    self.removeCSSClass('dismiss');
                }, options.dismissAnimationDuration);
                pinnedTo.classList.remove('bubble-active');
                pinnedTo.classList.remove('bubble-active-' + id);
                
                if (options.onHide) {
                    options.onHide();
                }
                return self;
            };
            
            this.destroy = function () {
                clearTimeout(dismissTimer);
                clearTimeout(autoDismissTimer);
                
                document.body.removeChild(bubbleEl);
                bubbleEl = null;
                closeEl = null;
                contentEl = null;
                bubbleTipEl = null;
                pinnedTo = null;
                delete bubblesArr[standardizeBubbleId(id)];
            };
            
                    
            bubbleEl = document.createElement('div');
            bubbleEl.id = standardizeBubbleId(id);
            bubbleEl.classList.add('bubble');
            
            // content
            contentEl = document.createElement('div');
            contentEl.classList.add('bubble-content');
            contentEl.innerHTML = options.contentHTML;
            bubbleEl.appendChild(contentEl);
            
            // close button
            if (options.showDismissal) {
                closeEl = document.createElement('a');
                closeEl.href = '#';
                closeEl.classList.add('bubble-close');
                closeEl.innerHTML = '<span><strong>&times;</strong></span>';
                closeEl.addEventListener('click', function() { self.dismiss(true); });
                bubbleEl.appendChild(closeEl);
            }
            else {
                this.addCSSClass('no_dismissal');
            }
            
            // bubble tip
            bubbleTipEl = document.createElement('div');
            bubbleTipEl.classList.add('bubble-arrow');
            bubbleTipEl.classList.add('up');
            bubbleEl.appendChild(bubbleTipEl);
            
            parent.appendChild(bubbleEl);
            pinnedTo.addEventListener('click', function() { self.dismiss(); });
            
            // add mouseover event if it's an autohider
            if(options.autoHide) {
                bubbleEl.addEventListener('mouseover', function() { if(!clickedToClose) self.show('mouseover'); });
                bubbleEl.addEventListener('mouseout', function() { if(!clickedToClose) self.show('mouseout'); });
            }
            
            // position bubble in relation to pinnedTo element
            // TODO
            var bubbleDim = getElementDimensions(bubbleEl);
            var pinnedDim = getElementDimensions(pinnedTo);
            //console.log(bubbleDim);
            //console.log(pinnedDim);
        };
    
         
    return {
    
        createNew: function (id, options) {
            var exists = this.getById(id);
            if (exists) {
                return exists;
            }
            else {
                var b = new Bubble(id, options);
                bubblesArr[standardizeBubbleId(id)] = b;
                return b;
            }
        },
        
        getAll: function () {
            return bubblesArr;
        },
        
        showAll: function() {
            var bbs = this.getAll();
            for (var key in bbs) {
                bbs[key].show();
            }
        },
        
        dismissAll: function() {
            var bbs = this.getAll();
            for (var key in bbs) {
                bbs[key].dismiss();
            }
        },
        
        getById: function (id) {
            if (!id) return false;
            return bubblesArr[standardizeBubbleId(id)];
        },
        
        deleteById: function (id) {
            if (id) {
                var b = bubblesArr[standardizeBubbleId(id)];
                if (b) {
                    b.remove();
                }
            }
        }
        
    };
    
})(document, window);