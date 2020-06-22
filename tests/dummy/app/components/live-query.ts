import Component from '@glimmer/component';
import { use, useLiveQuery } from 'ember-orbit';

interface Args {
  id?: string;
}

export default class extends Component<Args> {
  @use data = useLiveQuery((q) =>
    this.args.id
      ? q.findRecord({ type: 'planet', id: this.args.id })
      : q.findRecords('planet')
  );
}
