import Ember from 'ember';
import Orbit from '@orbit/data';

Orbit.Promise = Ember.RSVP.Promise;

extendPromise(Ember.RSVP.Promise);

function extendPromise(Promise) {
  Promise.prototype.tap = Promise.prototype.tap || function(callback) {
    return this.then(function (result) {
      return Promise.resolve(callback(result)).then(() => result);
    });
  };
}
