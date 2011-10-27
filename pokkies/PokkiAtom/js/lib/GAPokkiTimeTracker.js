// Copyright 2007 Google, Inc.
// This sample code is under the Apache2 license, see
// http://www.apache.org/licenses/LICENSE-2.0 for license details.
/**
 * @fileoverview Wrapper for Time Tracking
 */

/**
 * @class Time Tracking component.
 *     This class encapsulates all logic for time tracking on a particular
 *     page. Time tracking could be for any object within a page or the page
 *     itself.
 *
 * @param {Array.<Number>} arg1 Optional array that represents the bucket
 * @constructor
 */
var TimeTracker = function(opt_bucket) {
  if (opt_bucket) {
    this.bucket_ = opt_bucket.sort(this.sortNumber); 
  } else {
    this.bucket_ = TimeTracker.DEFAULT_BUCKET;
  }
};

TimeTracker.prototype.startTime_;
TimeTracker.prototype.stopTime_;
TimeTracker.prototype.bucket_;
TimeTracker.DEFAULT_BUCKET = [100, 500, 1500, 2500, 5000];

/**
 * Calculates time difference between start and stop
 * @return {Number} The time difference between start and stop
 */
TimeTracker.prototype._getTimeDiff = function() {
  return (this.stopTime_ - this.startTime_);
};

/**
 * Helper function to sort an Array of numbers
 * @param {Number} arg1 The first number
 * @param {Number} arg2 The second number
 * @return {Number} The difference used to sort
 */
TimeTracker.prototype.sortNumber = function(a, b) {
  return (a - b);
};

/**
 * Records the start time
 * @param {Number} arg1 Optional start time specified by user
 */
TimeTracker.prototype._recordStartTime = function(opt_time) {
  if (opt_time != undefined) {
    this.startTime_ = opt_time;
  } else {
    this.startTime_ = (new Date()).getTime();
  }
};

/**
 * Records the stop time
 * @param {Number} arg1 Optional stop time specified by user
 */
TimeTracker.prototype._recordEndTime = function(opt_time) {
  if (opt_time != undefined) {
    this.stopTime_ = opt_time;
  } else {
    this.stopTime_ = (new Date()).getTime();
  }
};

/**
 * Tracks the event. Calculates time and sends information to
 * the event tracker passed
 * @param {Object} arg1 GA tracker created by user
 * @param {String} arg2 Optional event object name
 * @param {String} arg3 Optional event label
 */
TimeTracker.prototype._track = function(tracker,
                                        opt_event_obj_name,
                                        opt_event_label) {
  var eventTracker;
  if (opt_event_obj_name != undefined && opt_event_obj_name.length != 0) {
    eventTracker = tracker._createEventTracker(opt_event_obj_name);
  } else {
    eventTracker = tracker._createEventTracker('TimeTracker');
  }

  var i;
  var bucketString;
  for(i = 0; i < this.bucket_.length; i++) {
    if ((this._getTimeDiff()) < this.bucket_[i]) {
      if (i == 0) {
        bucketString = "0-" + (this.bucket_[0]);
        break;
      } else {
        bucketString = this.bucket_[i - 1] + "-" + (this.bucket_[i] - 1);
        break;
      }
    }
  }
  if (!bucketString) {
    bucketString = this.bucket_[i - 1] + "+";
  }
  eventTracker._trackEvent(bucketString, opt_event_label, this._getTimeDiff());
};

/**
 * Sets the bucket for histogram generation in GA
 * @param {Array.<Number>} The bucket array
 */
TimeTracker.prototype._setHistogramBuckets = function(buckets_array) {
  this.bucket_ = buckets_array.sort(this.sortNumber);
};



/**
 * Google Analytics Time Tracker for Pokki
 * For all details and documentation:
 * https://github.com/blakemachado/Pokki
 * Extended and adapted for Pokkies from TimeTracker, originally by Google, Inc.
 *
 * @version     1.0
 * @license     MIT License
 * @author      Fontaine Shu <fontaine@sweetlabs.com>, SweetLabs, Inc.
 * @copyright   (c) 2011, Authors
 *
 * Example usage:
 * - pokki_timer = new PokkiTimeTracker();
 * - pokki_timer._recordStartTime();
 * - pokki_timer._recordEndTime();
 * // Specify your own histogram "action" values
 * - pokki_timer._setHistogramBuckets([10, 20, 50, 100, 500, 1000]);
 * // Track via historgram buckets
 * - pokki_timer._track();
 */
PokkiTimeTracker.prototype = new TimeTracker();
function PokkiTimeTracker(opt_bucket) {
    TimeTracker.apply(this, arguments);
}
/**
 * TimeTracker._track logic
 * @param opt_event_obj_name String Optional event object name
 * @param opt_event_label    String Optional event label
 * @param opt_time_func      Function Optional Can be used to convert time value from milliseconds to something more readable, like minutes
 */
PokkiTimeTracker.prototype._track = function(opt_event_obj_name, opt_event_label, opt_time_func) {
    var category = (opt_event_obj_name != undefined && opt_event_obj_name.length != 0) ? opt_event_obj_name : 'TimeTracker';
    
    var i;
    var bucketString;
    var time_diff = opt_time_func ? opt_time_func(this._getTimeDiff()) : this._getTimeDiff();
    
    for(i = 0; i < this.bucket_.length; i++) {
        if (time_diff < this.bucket_[i]) {
            if (i == 0) {
                bucketString = "0-" + (this.bucket_[0]);
                break;
            } else {
                bucketString = this.bucket_[i - 1] + "-" + (this.bucket_[i] - 1);
                break;
            }
        }
    }
    
    if (!bucketString) {
        bucketString = this.bucket_[i - 1] + "+";
    }
    
    ga_pokki._trackEvent(category, bucketString, opt_event_label, opt_time_func ? opt_time_func(this._getTimeDiff()) : this._getTimeDiff());
};