import { Promise as EmberPromise } from 'rsvp';
import Orbit from '@orbit/data';

Orbit.Promise = EmberPromise;

extendPromise(EmberPromise);

function extendPromise(Promise) {
  Promise.prototype.tap = Promise.prototype.tap || function(callback) {
    return this.then(function (result) {
      return Promise.resolve(callback(result)).then(() => result);
    });
  };
}
