(function() {
/* global define, RSVP, jQuery, sinon */

define('rsvp', [], function() {
  "use strict";

  return Ember.RSVP;
});
})();

define('jquery', [], function() {
  "use strict";

  return {
    'default': jQuery
  };
});

define('sinon', [], function() {
  "use strict";

  return sinon;
});
