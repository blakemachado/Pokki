/**
 * Facebook Pokki / baseController.js
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * Note: needs to be updated to use LocalStore class for consistency
 *
 * @version     1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */

var BaseController = new Class({
    Implements: Events,
    
    initialize: function() {
    
    },
    
    get_access_token: function() {
        return pokki.descramble(window.localStorage.getItem(KEYS.FB_ACCESS_TOKEN));
    },
    
    set_access_token: function(token) {
        this.access_token = token;
        window.localStorage.setItem(KEYS.FB_ACCESS_TOKEN, pokki.scramble(token));
    },
    
    get_user: function() {
        var user = JSON.decode(pokki.descramble(window.localStorage.getItem(KEYS.FB_USER)));
        return user ? user : {};  
    },
    
    set_user: function(data) {
        window.localStorage.setItem(KEYS.FB_USER, pokki.scramble(JSON.encode(data)));
    },
    
    make_graph_call: function(url, callback) {
        var r = new Request.JSONP({
            url: url,
            onComplete: callback,
            onFailure: function(xhr) {
                console.log('Ajax fail');
            },
            onTimeout: function() {
                console.log('Timeout');
            },
            onException: function(headerName, value) {
                console.log('Exception');
            },
            onError: function() {
                console.log('error');
            }
        }).send();
        
        return r;
    },
    
    update_cache: function(key, data) {
        try {
            window.localStorage.setItem(key, data);
        }
        catch(e) {
            console.log(e);
            
            try {
                window.localStorage.removeItem(key);
                window.localStorage.setItem(key, data);
            }
            catch(e) {
                console.log(e);
            }
        }
    }
});