import Orbit from 'orbit';

if( !Ember.RSVP.Promise ) { throw new Error('Ember.RSVP.Promise is missing'); }

Orbit.Promise = Ember.RSVP.Promise;
