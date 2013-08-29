/**
 * Utility to help handle retrieving and setting data in LocalStorage
 * JavaScript Library independent
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
            return item !== null ? JSON.parse(item) : (typeof that.defaultVal === 'undefined' ? null : that.defaultVal);
        }
        catch(e) {
            return item !== null ? item : (typeof that.defaultVal === 'undefined' ? null : that.defaultVal);
        }
    };
    
    this.set = function(value) {
        window.localStorage.setItem(that.key, this.scrambled ? pokki.scramble(JSON.stringify(value)) : JSON.stringify(value));
        return value;
    };
    
    this.remove = function() {
        window.localStorage.removeItem(that.key);    
    };
};
