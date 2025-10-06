import { LinkTo } from '@ember/routing';
import RouteTemplate from 'ember-route-template';

export default RouteTemplate(
  <template>
    <LinkTo @route="filtered">Filtered</LinkTo>
  </template>,
);
