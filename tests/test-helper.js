import './support/rsvp-extension';
import './support/orbit-setup';

import resolver from './helpers/resolver';
import {
  setResolver
} from 'ember-qunit';

setResolver(resolver);
