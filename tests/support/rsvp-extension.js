(function (RSVP) {

    if (!RSVP) {
        return;
    }

    RSVP.Promise.prototype.tap = function(callback) {
      return this.then(function (result) {
        return RSVP.Promise.resolve(callback(result)).then(() => result);
      });
    };
})(Ember.RSVP);
