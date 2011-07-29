/**
 * LocalStore - Utility class for accessing localStorage
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 *
 * @version     1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 *              Blake Machado <blake@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 */
 
var LocalStore = function(key, options) {
    this.options = {
        defaultVal: null,
        scrambled: false // whether or not to run pokki.scramble and pokki.descramble on the data
    }
    
    for(item in options) {
        this.options[item] = options[item];
    }
    
    this.key = key;
    this.defaultVal = this.options.defaultVal;
    this.scrambled = this.options.scrambled;
    
    var that = this;
    
    this.get = function() {
        var item = window.localStorage.getItem(that.key);
        if(this.scrambled && item) item = pokki.descramble(item);
        
        try {
            return item !== null ? JSON.parse(item) : (that.defaultVal ? that.defaultVal : null);
        }
        catch(e) {
            return item !== null ? item : (that.defaultVal ? that.defaultVal : null);
        }
    };
    
    this.set = function(value) {
        window.localStorage.setItem(that.key, this.scrambled ? pokki.scramble(JSON.stringify(value)) : JSON.stringify(value));
    };
    
    this.remove = function() {
        window.localStorage.removeItem(that.key);    
    };
};