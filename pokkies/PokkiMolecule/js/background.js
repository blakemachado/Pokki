var BackgroundApp = function() {
    var that = this;
    var feed_cache  = new LocalStore(LSKEY.FEED_CACHE, {defaultVal: []});
    var feed_unseen  = new LocalStore(LSKEY.FEED_UNSEEN, {defaultVal: []});
    
    this.api_url =  'https://www.instapaper.com/api/1/';
    this.callback_url = 'http://www.pokki.com/';
    this.oauth_options = {
        prefix: LSKEY.OAUTH_PREFIX
    };
    
    this._get_consumer_key = function() {
        return pokki.getScrambled('consumer_key');
    }
    
    this._get_consumer_secret = function() {
        return pokki.getScrambled('consumer_secret');
    }
    
    var auth = new xAuthManager(this._get_consumer_key(), this._get_consumer_secret(), this.api_url, this.callback_url, this.oauth_options);

    // context menu
    if(auth.is_logged_in()) {
        logged_in();
    }
    else {
        logged_out();
    }    
    
    /**
     * Polling function
     */
    function poll_feed() {
        loadFeed(RSS_FEED);
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
                // check for new items in the feed
                // TODO
            
                // save the results to localStorage for caching
                feed_cache.set(result.feed.entries);
                pokki.rpc('update_feed();');
            }
        });
    }
    
    // feed polling
    this.start_poll = function() {
        poll_feed(); // initial call
        setInterval(poll_feed, 1000 * 60 * 60 * 12) // every 12 hours
    };
    
    this.logout = function() {
        auth.logout();
        logged_out();
    };
};

MoleculeBackground = new BackgroundApp();

// Add listener for context_menu
pokki.addEventListener('context_menu', onContextMenu);

function onContextMenu(key) {
    console.log('Context menu item was clicked');
    
    switch(key) {
        case 'insta':
            // tell pokki to open it in a normal browser
            pokki.openURLInDefaultBrowser('http://www.instapaper.com/u');
            // close the popup so user can interact with browser
            pokki.closePopup();
            break;
        case 'logout':
            if(MoleculeBackground) MoleculeBackground.logout();
            pokki.rpc('if(Molecule) Molecule.onLogout();');
            break;
    }
}

// Context menu states             
function logged_in() {
    pokki.resetContextMenu();
    pokki.addContextMenuItem('Go to Instapaper', 'insta');
    pokki.addContextMenuItem('Log out', 'logout');
}

function logged_out() {
    pokki.resetContextMenu();
    pokki.addContextMenuItem('Go to Instapaper', 'insta');
}