var Instapaper = function() {
    var that = this;
    this.feedback = new Feedback('', 4000);
    this.api_url =  'https://www.instapaper.com/api/1/';
    this.callback_url = 'http://www.pokki.com/';
    this.oauth_options = {
        prefix: LSKEY.OAUTH_PREFIX,
        onLogin: function() {
            // hide login form
            that._hide_login();
            // tell background page
            pokki.rpc('logged_in();');
            // continue with last action that user tried to do
            if(that.login_callback) {
                that.login_callback();
            }
            // GA event
            ga_pokki._trackEvent('User', 'FirstConnected');
        }
    };
    
    this._get_consumer_key = function() {
        return pokki.getScrambled('consumer_key');
    }
    
    this._get_consumer_secret = function() {
        return pokki.getScrambled('consumer_secret');
    }
    
    /**
     * Display xAuth log in screen
     */
    this._show_login = function() {    
        that.feedback.hide();
        document.getElementById('login').classList.remove('hide');
        document.getElementById('login').classList.add('show');
    }
    
    /**
     * Hide xAuth log in screen
     */
    this._hide_login = function(e, cancel) {
        if(cancel) {
            setTimeout(function() {
                that.feedback.set_message('You must log in to save to Instapaper');
                that.feedback.show();
            }, 500);
        }
        
        var login = document.getElementById('login');
        var login_form = document.getElementById('login_form');
        var login_button = document.getElementById('login_button');
        
        login.classList.remove('show');
        login.classList.add('hide');
        setTimeout(function() {
            login.classList.remove('hide');
        }, 500);
        
        login_form.reset();
        login_form.classList.remove('shake');
        login_form.classList.remove('hold');
        
        login_button.classList.remove('loading');
    };
};

/**
 * Initializes OAuth authentication
 */
Instapaper.prototype._init_oauth = function() {
    this.auth = new xAuthManager(this._get_consumer_key(), this._get_consumer_secret(), this.api_url, this.callback_url, this.oauth_options);

    var that = this;
    document.getElementById('login_form').addEventListener('submit', function(e) { that.handle_login(e); });
    document.getElementById('login_form').addEventListener('keydown', 
        function(e) {
            // handle ENTER key
            if(e.keyCode == 13) {
                that.handle_login(e);
            }
        }
    );
}

/**
 * Check to see that user has authenticated already
 */ 
Instapaper.prototype.verify_login = function() {
    if(!this.auth) { this._init_oauth(); }
    return this.auth.is_logged_in();
};
    
/**
 * Handles form submission
 */
Instapaper.prototype.handle_login = function(e) {
    if(e) e.preventDefault();
    
    var login_button = document.getElementById('login_button');
    var login_form = document.getElementById('login_form');
    var username = login_form.username.value;
    var password = login_form.password.value;
    
    // if form isn't already submitting, process it
    if(!login_button.classList.contains('loading')) {
        if(username.trim() == '') {
            login_form.classList.remove('hold');
            login_form.classList.add('shake');
            setTimeout(function() {
                login_form.classList.remove('shake');
                login_form.classList.add('hold');
            }, 600);
        }
        else {
            login_button.classList.add('loading');
            // authenticate with Instapaper
            this.auth.access_token('oauth/access_token', true, username, password);
        }
    }
};

/**
 * Save bookmark
 */
Instapaper.prototype.add_bookmark = function(data, callback) {
    if(!this.auth) { this._init_oauth(); }
    
    var that = this;
    if(!this.verify_login()) {
        this.login_callback = function(){
            that.add_bookmark(data, callback);
            that.login_callback = false;
        };
        this._show_login();
    }
    else {
        this.feedback.set_message('Saving...');
        this.feedback.show(true);
        // ping instapaper
        this.auth.api_call('bookmarks/add', data, true, false, true, 
            function(data) {
                that.feedback.set_message('<strong>Bookmarked!</strong>');
                that.feedback.show();
                if(callback) callback(data);
            }
        );
    }
}; 

/**
 * Logout
 */
Instapaper.prototype.logout = function() {
    if(!this.auth) { this._init_oauth(); }
    
    this.auth.logout();
};