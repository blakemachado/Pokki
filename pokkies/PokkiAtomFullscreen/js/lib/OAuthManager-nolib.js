/**
 * Manages the OAuth login flow, Javascript library independent
 * @requires oauth.js
 * @requires sha1.js
 * @requires LocalStore.js
 */
var OAuthManager = function(consumer_key, consumer_secret, api_url, callback_url, options) {
    var that = this;
    
    // default options
    this.options = {
        signature_method: 'HMAC-SHA1',
        websheet_width: 700,
        websheet_height: 460,
		// prefix for localstorage keys
        prefix: 'oa',
		// if you're expecting a login url to be passed back in authorize, pass the param name in here
		authorize_url_param_name: 'login_url',
		// custom events that are available to listen to
        onAuthorizeStart: function(){},
        onAuthorizeComplete: function(){},
        onLogin: function(){},
        onError: function(xhr){ that.onError(xhr); },
        onOauthVerifierSet: function(){},
		onPermissionDenied: function(){}
    };
    
    // set options
    for(var key in options) {
        this.options[key] = options[key];
    }
    
    this.consumer_key       = consumer_key;
    this.consumer_secret    = consumer_secret;
    this.api_url            = api_url;
    this.callback_url       = callback_url;
    this.signature_method   = this.options.signature_method;
    this.method             = 'GET';
    this.use_pincode_verify = this.callback_url == 'oob';
    
    /**
     * Checks localStorage to see if oauth_token and oauth_token_secret are set, indicating logged in state
     */
    this.is_logged_in = function() {
        var oauth_token         = new LocalStore(that.options.prefix + 'oauth_token', {defaultVal: false, scrambled: true});
        var oauth_token_secret  = new LocalStore(that.options.prefix + 'oauth_token_secret', {defaultVal: false, scrambled: true});
        
        if(oauth_token.get() && oauth_token_secret.get()) {
			that.oauth_token         = oauth_token.get();
			that.oauth_token_secret  = oauth_token_secret.get();
            return true;
        }
        return false;
    };
	
	/**
     * Requests OAuth token
     * @param String    request_token_func  method to call, e.g. oauth/request_token
     * @param Function  callback            post auth callback
     */
    this._request_token = function(request_token_func, callback) {
        var params  = that._format_oauth(request_token_func, {
		    oauth_callback: that.callback_url
		}, false, false);
       
		that.api_call(
            request_token_func,
            params,
            false,
            false,
            false,
            callback
        );
	};
	
	this._parse_query_string = function(querystring) {
        var keyvaluepairs = querystring.split('&');
        var token = {};
        for(var i = 0; i < keyvaluepairs.length; i++) {
            var split = keyvaluepairs[i].split('=');
            token[split[0]] = decodeURIComponent(split[1]);
        }
        return token;
	};
    
    this.set_pincode_verif = function(pin) {
        that.oauth_verifier = pin;
        that.options.onOauthVerifierSet();
    };
    
    this.set_oauth_verif = function(query) {
		var verifier = that._parse_query_string(query);
		that.oauth_verifier = verifier.oauth_verifier;
		if(that.oauth_verifier)
			that.options.onOauthVerifierSet();
		else
			that.options.onPermissionDenied();
	};
};

/**
 * Prepares requests with OAuth signatures
 */
OAuthManager.prototype._format_oauth = function(func, params, accessors, post) {
	method      = (post ? 'POST' : this.method);
	accessors   = accessors || false;

	var message = {
		action: this.api_url + func,
		method: method,
        parameters: [
            ['oauth_signature_method', this.signature_method],
            ['oauth_consumer_key', this.consumer_key]
        ]
    };

	if (params) {
        for(key in params) {
            message.parameters.push([key, params[key]]);
        }
	}

	var accessor = {
	    consumerSecret: this.consumer_secret
	};
	
	if (accessors) {
        for(key in accessors) {
            accessor[key] = accessors[key];
        }
	}

	OAuth.setTimestampAndNonce(message);
	OAuth.SignatureMethod.sign(message, accessor);
			
	return OAuth.formEncode(message.parameters);
};

/**
 * Sends the user to athorization
 * @param String    request_token_func  method to call, e.g. oauth/request_token
 */
OAuthManager.prototype.authorize = function(request_token_func) {
	var that = this;
	this.options.onAuthorizeStart();
	this._request_token(request_token_func, function(data) {
	   that.authorize_callback(data);
	});
};
	
/**
 * Callback post-authorization
 * @param String    data    Returned values from authorize
 */
OAuthManager.prototype.authorize_callback = function(data) {
    var token = this._parse_query_string(data);      
    this.login_url = token[this.options.authorize_url_param_name];
    this.request_key = token.oauth_token;
    this.request_secret = token.oauth_token_secret;
    this.onAuthorizeComplete();
};
    
/**
 * Listener for completed authorization, takes user to log in & connect prompt
 * from the service. Depending on whether or not this is a PIN code verification,
 * this will launch a websheet or a web browser, the latter of which expects
 * the pokki to have support for receiving a pin code.
 */
OAuthManager.prototype.onAuthorizeComplete = function() {
    var that = this;
    if(this.login_url) 
        var login_url = this.login_url + (this.login_url.contains('oauth_token') ? '' : '?oauth_token=' + this.request_key);
    else
        var login_url = this.api_url + 'oauth/authorize?oauth_token=' + this.request_key;
    
    if(this.use_pincode_verify) {
        // opens the oauth login in the default browser
        // pokki must support entering a pin code after user is done with this page
        pokki.openURLInDefaultBrowser(login_url);
    }
    else {
        pokki.showWebSheet(
            login_url,
            this.options.websheet_width,
            this.options.websheet_height,
            function(url) {
                if(url.search(that.callback_url) >= 0) {
                    url = url.replace(that.callback_url + '?', '');
                    that.set_oauth_verif(url);
                    return false;
                }
				return true;
            },
            function(){}
        );
    }
    
    this.options.onAuthorizeComplete();
};

OAuthManager.prototype.access_token = function(access_token_func, is_post) {
    is_post = is_post ? is_post : false;
	var that = this;
	var params = this._format_oauth(
		access_token_func,
		{
			oauth_token:    this.request_key,
			oauth_verifier: this.oauth_verifier
		},
		{
			tokenSecret: this.request_secret
		},
		is_post
	);

	this.api_call(
        access_token_func,
        params,
        false,
        false,
        is_post,
        function(data) {
            that.access_token_callback(data);
        }
    );
};

OAuthManager.prototype.access_token_callback = function(data) {
    var result = this._parse_query_string(data);
    
    for(key in result) {
        var ls = new LocalStore(this.options.prefix + key, {scrambled: true});
        ls.set(result[key]);
    }
    
    this.oauth_token        = result.oauth_token;
    this.oauth_token_secret = result.oauth_token_secret;
    
    this.request_key = null;
    this.request_secret = null;
    
    this.options.onLogin();
};

OAuthManager.prototype.api_call = function(func, params, needs_auth, format_json, is_post, callback) { console.log();
    var that = this;
    
    if(is_post) {
		method = 'POST';
		is_post = true;
	} 
    else {
		method = this.method;
		is_post = (method == 'POST' ? true : false);
	}

	if (needs_auth) {
		var signParams = {oauth_token: this.oauth_token};
		for(key in params) {
            signParams[key] = params[key];
		}

		params = this._format_oauth(func, signParams, {
		    tokenSecret: this.oauth_token_secret
		}, is_post);
	}

	var callUrl = this.api_url + func;	

	var r = new XMLHttpRequest();
	r.open(method,callUrl + '?' + params,true);
	r.setRequestHeader('X-Requested-With', null);
	r.setRequestHeader('Accept', null);
	r.onreadystatechange = function() {
        if(r.readyState == 4 || r.readyState == 'complete') {
            if(r.status == 200) {
                var data = format_json ? JSON.parse(r.responseText) : r.responseText;   
			    callback(data);
            }
            else
                that.options.onError(r);
        }
    };
	r.send(null);
};

OAuthManager.prototype.logout = function() {
    var oauth_token         = new LocalStore(this.options.prefix + 'oauth_token', {defaultVal: false, scrambled: true});
    var oauth_token_secret  = new LocalStore(this.options.prefix + 'oauth_token_secret', {defaultVal: false, scrambled: true});
    
    oauth_token.remove();
    oauth_token_secret.remove();
    
    this.oauth_token        = false;
    this.oauth_token_secret = false;
};

OAuthManager.prototype.onError = function(xhr) {
    console.log('error', xhr.responseText);
};