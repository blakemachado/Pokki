/**
 * A simple app to browse latest Smashing Magazine feed and save to Instapaper
 * Showcases 
 * - OAuth/xAuth
 * - Google JSAPI
 * - HTML5 Drag & Drop
 * - Crossdomain Ajax requests
 * - Background polling
 * - LocalStorage
 */
var App = function() {    
    var that        = this; // Bind this to that for proper reference to the this object within closures
    var wrapper     = document.getElementById('wrapper');
    var drop_target = document.getElementById('target');
    var feed_list   = document.getElementById('feed');
    var feed_cache  = new LocalStore(LSKEY.FEED_CACHE, {defaultVal: []});
    var feed_unseen = new LocalStore(LSKEY.FEED_UNSEEN, {defaultVal: []});
    var unloaded    = new LocalStore(LSKEY.UNLOADED);
    var api         = new Instapaper();
    var splash_ran  = unloaded.get() ? true : false;
       
    // initialize feed, either from cache or from fresh load
    if(feed_cache.get().length == 0) {
        if(_FEED_API_LOADED) {
            loadFeed(RSS_FEED);
        }
    }
    else {
        // fill it with cached results
        generateFeedDom(feed_cache.get());
    }
    
    /**
     * Load rss feed for specified url
     */
    function loadFeed(url) {
        var feed = new google.feeds.Feed(url);
        feed.setNumEntries(30);
        feed.includeHistoricalEntries();
        feed.load(function(result) {
            if (!result.error) {
                // save the results to localStorage for caching
                feed_cache.set(result.feed.entries);
                // create the HTML and display it
                generateFeedDom(result.feed.entries);
            }
        });
    }
    
    /**
     * Creates the HTML needed to render the list of feed items
     */
    function generateFeedDom(items) {
        var container = document.getElementById('feed');
        container.innerHTML = '';
        
        var unseen = feed_unseen.get();
        
        for (var i = 0; i < items.length; i++) {
            var entry = items[i];
            
            var item = document.createElement('div');
            item.classList.add('item');
            item.classList.add('ui');
            item.classList.add('ui-more_info');
            
            // if in unseen list, add new indicator
            if(entry.unread) {
                item.classList.add('new');
            }
            
            item.draggable = true;
            item.style.webkitUserDrag = 'element';
            item.href = entry.link;
                            
            var title = document.createElement('span');
            title.classList.add('title');
            title.innerHTML = entry.title;
            item.appendChild(title);
            
            var d = new Date(entry.publishedDate);
            var date = document.createElement('span');
            date.classList.add('date');
            date.innerHTML = (d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear();
            item.appendChild(date);
                                
            var snippet = document.createElement('span');
            snippet.classList.add('snippet');
            snippet.innerHTML = entry.contentSnippet;
            item.appendChild(snippet);
            
            container.appendChild(item);
        }
    }
    
    /**
     * Listens to the clicks inside of the #wrapper div and delegates events accordingly
     * doing this saves you from having to reattach events to dom nodes that change
     * or are brought in dynamically
     */
    function delegateEvent(e) {
        var target = e.target;  
        var parent = target.parentElement;
        
        // check to see if <a> click was for a link
        if(target.nodeName.toLowerCase() === 'a' || parent.nodeName.toLocaleLowerCase() === 'a') {
            e.preventDefault();
            
            var el = target.nodeName.toLowerCase() === 'a' ? target : parent;
            
            // click is a normal external url
            if(!el.classList.contains('ui')) {
                var url = el.href;
            
                // tell pokki to open it in a normal browser
                pokki.openURLInDefaultBrowser(url);
                // close the popup so user can interact with browser
                pokki.hide();
                
                return false;
            }
        }
        
        if(target.classList.contains('ui') || parent.classList.contains('ui')) {  
            e.preventDefault();
            
            var el = target.classList.contains('ui') ? target : parent;
            // link is ui related
            if(el.classList.contains('ui-more_info')) {
                // follow link in default browser
                var url = el.href;
                // tell pokki to open it in a normal browser
                pokki.openURLInDefaultBrowser(url);
                // close the popup so user can interact with browser
                pokki.hide();
            }
            else if(el.classList.contains('ui-link')) {
                // follow link in default browser
                var url = el.href;
                // tell pokki to open it in a normal browser
                pokki.openURLInDefaultBrowser(url);
                // close the popup so user can interact with browser
                pokki.hide();
            }
            else if(el.classList.contains('ui-login')) {
                api.handle_login();
            }
            else if(el.classList.contains('ui-login_close')) {
                api._hide_login(false, true);
            }
            
            return false;  
        }
    }   
    
    function add_bookmark_callback(data) {
        drop_target.classList.add('saved');
        setTimeout(function() {
            drop_target.classList.remove('saved');
        }, 410);
    } 
    
    //////////////////////////////////////////////////////////////////////
    ///// ATTACH EVENTS
    //////////////////////////////////////////////////////////////////////
    
    // initialize event delegation for <a> clicks
    wrapper.addEventListener('click', delegateEvent);
    
    // initialize draggable & droppable events
    feed_list.addEventListener('dragstart', function(e) {
        var target = e.target;
        target.classList.add('dragging');
        drop_target.classList.add('dragging');
        
        var data = {
            url: target.href,
            title: '',
            description: ''
        }
        
        var span = target.getElementsByTagName('span');
        for(var i = 0; i < span.length; i++) {
            if(span[i].classList.contains('title')) {
                data.title = span[i].innerHTML.trim();
            }
            else if(span[i].classList.contains('snippet')) {
                data.description = span[i].innerHTML.trim().replace(/&nbsp;/g,'');
            }
        }
        
        e.dataTransfer.dropEffect = 'copyLink';
        e.dataTransfer.effectAllowed = 'copyLink';
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
    }, false);
    
    feed_list.addEventListener('dragend', function(e) {
        e.target.classList.remove('dragging');
        drop_target.classList.remove('dragging');
        drop_target.classList.remove('over');
    }, false);
    
    drop_target.addEventListener('drop', function(e) {
        e.preventDefault();
        var data = JSON.parse(e.dataTransfer.getData('text/plain'));
        // ping instapaper
        api.add_bookmark(data, add_bookmark_callback);
    });
    
    drop_target.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('over');
    }, false);
    
    drop_target.addEventListener('dragenter', function(e) {
        this.classList.add('over');
    }, false);
    
    drop_target.addEventListener('dragleave', function(e) {
        this.classList.remove('over');
    }, false);
    
    
    // Pulls from cache and regenerates list
    this.reload_feed = function() {
        generateFeedDom(feed_cache.get());
    };
        
    //////////////////////////////////////////////////////////////////////
    ///// POKKI EVENT LISTENERS
    //////////////////////////////////////////////////////////////////////
        
    /**
     * Kick off what needs to be done whenever the popup is about to be shown
     */
    this.onPopupShowing = function() {    
    
    };
    
    /**
     * Kick off what needs to be done when the popup is shown
     */
    this.onPopupShown = function() {
        var splash = document.getElementById('splash');
        var atom = document.getElementById('atom');
            
        // animate splash on first run
        if(!splash_ran) {
            splash.classList.add('animate');
            atom.classList.add('animate');
            wrapper.classList.remove('show');
            
            // allows the css animation to run for some time before removing the animation class
            setTimeout(function() {
                splash.classList.remove('animate');
                atom.classList.remove('animate');
                wrapper.classList.add('show');
                
                // stagger content animation
                var li = wrapper.getElementsByClassName('item');
                                
                for(var i = 0; i < li.length; i++) {
                    if(i > 15) break; // past 15, the items aren't shown so just display them normally
                    li[i].style['-webkit-animation-duration'] = (100 * i + 200) + 'ms, 250ms';
                    li[i].style['-webkit-animation-delay'] = '0ms,'+ (100 * i + 200) + 'ms';
                }
            }, 2200);
            
            splash_ran = true;
        }
        else if(unloaded.get()) {
            splash.classList.remove('animate');
            atom.classList.remove('animate');
            wrapper.classList.add('show');
                
            // stagger content animation
            var li = wrapper.getElementsByClassName('item');
                            
            for(var i = 0; i < li.length; i++) {
                if(i > 12) break; // past 12, the items aren't shown so just display them normally
                li[i].style['-webkit-animation-duration'] = (100 * i + 200) + 'ms, 250ms';
                li[i].style['-webkit-animation-delay'] = '0ms,'+ (100 * i + 200) + 'ms';
            }
        }
        unloaded.remove();
    };
    
    /**
     * Kick off what needs to be done when the popup is hidden
     */
    this.onPopupHidden = function() {
    
    };
    
    /**
     * Use this to store anything needed to restore state when the user opens the Pokki again
     */
    this.onPopupUnload = function() {
        unloaded.set(true);
    };
    
    /**
     * User requests log out
     */
    this.onLogout = function() {
        api.logout();
    };
};