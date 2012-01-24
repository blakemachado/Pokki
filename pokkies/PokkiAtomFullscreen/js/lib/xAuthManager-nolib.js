/**
 * Manages the xAuth login flow, Javascript library independent
 * @requires oauth.js
 * @requires sha1.js
 * @requires OAuthManager.js
 * @requires LocalStore.js
 */
 
// Extend the OAuthManager class
xAuthManager.prototype = new OAuthManager();

// Define the xAuthManager class.
function xAuthManager(consumer_key, consumer_secret, api_url, callback_url, options) {
    OAuthManager.apply(this, arguments);
};

/**
 * Override access_token logic
 * @param is_post arbitrary, always true for xAuth
 */
xAuthManager.prototype.access_token = function(access_token_func, is_post, username, password) {
	var that = this;
	
	var params = {
	   oauth_consumer_key: this.consumer_key,
	   x_auth_username: username,
	   x_auth_password: password,
	   x_auth_mode: 'client_auth'
	};
	
	OAuth.completeRequest(
        {
            method: 'post',
            action: this.api_url + access_token_func,
            parameters: params
        }, 
        {
	       consumerSecret: this.consumer_secret
        }
    );
    
    this.api_call(
        access_token_func, 
        params, 
        false, 
        false, 
        true, 
        function(data) {
            that.access_token_callback(data);
        }
    );
};

// Override access_token_callback logic
xAuthManager.prototype.access_token_callback = function(data) {
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

// Override api_call logic
xAuthManager.prototype.api_call = function(func, params, needs_auth, format_json, is_post, callback) {
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
	r.open(method,callUrl,true);
	r.setRequestHeader('Authorization', OAuth.getAuthorizationHeader(callUrl, params));
	r.setRequestHeader('X-Requested-With', null);
	r.setRequestHeader('Accept', null);
	r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
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
	r.send(OAuth.formEncode(params));
};