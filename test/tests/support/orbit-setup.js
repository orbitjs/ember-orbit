import Orbit from 'orbit';
console.log('orbit setup');

if( !Ember.RSVP.Promise ) { throw new Error('Ember.RSVP.Promise is missing'); }

Orbit.Promise = Ember.RSVP.Promise;
