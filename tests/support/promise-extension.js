import { Promise as EmberPromise } from 'rsvp';

extendPromise(EmberPromise);
extendPromise(Promise);

function extendPromise(PromiseContructor) {
  PromiseContructor.prototype.tap =
    PromiseContructor.prototype.tap ||
    function(callback) {
      return this.then(function(result) {
        return PromiseContructor.resolve(callback(result)).then(() => result);
      });
    };
}
