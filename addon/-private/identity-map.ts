import Orbit, { RecordIdentity, serializeRecordIdentity, Record, Query } from '@orbit/data';
import { Dict } from '@orbit/utils';

import ModelFactory, { RecordModel } from './model-factory';

const { deprecate } = Orbit;

export interface IdentityMapSettings {
  factory: ModelFactory;
}

export default class IdenityMap {
  protected _factory: ModelFactory;
  protected _map: Dict<RecordModel>

  constructor(settings: IdentityMapSettings) {
    this._factory = settings.factory;
    this._map = {};
  }

  lookup(identity: RecordIdentity) {
    if (!identity) {
      return;
    }

    const record = this._materialized(identity);

    if (record) {
      return record;
    }
    return this._materialize(identity);
  }

  lookupMany(identities: RecordIdentity[]) {
    return identities.map(identity => this.lookup(identity));
  }

  lookupQueryResult(query: Query, result: Record | Record[] | null) {
    switch(query.expression.op) {
      case 'findRecord':
      case 'findRelatedRecord':
        return this.lookup(result as RecordIdentity);
      case 'findRecords':
      case 'findRelatedRecords':
        return this.lookupMany(result as RecordIdentity[]);
      default:
        return result;
    }
  }

  has(identity: RecordIdentity) {
    return !!this._materialized(identity);
  }

  includes(identity: RecordIdentity) {
    deprecate('`IdentityMap.includes(identity)` is deprecated, use `IdentityMap.has(identity)`.');
    return this.has(identity);
  }

  evict(identity: RecordIdentity) {
    const record = this._materialized(identity);

    if (record) {
      const identifier = serializeRecordIdentity(identity);
      delete this._map[identifier];
      this._factory.disconnect(record);
    }
  }

  notifyPropertyChange(identity: RecordIdentity, property: string) {
    const record = this._materialized(identity);

    if (record) {
      this._factory.notifyPropertyChange(record, property);
    }
  }

  deactivate() {
    this.forEach((record: RecordModel) => {
      this._factory.disconnect(record);
    });
    this._map = {};
  }

  forEach(callback: (record: RecordModel) => void) {
    for (let identifier in this._map) {
      callback(this._map[identifier]);
    }
  }

  protected _materialized(identity: RecordIdentity) {
    if (!identity) {
      return;
    }

    const identifier = serializeRecordIdentity(identity);

    return this._map[identifier];
  }

  protected _materialize(identity: RecordIdentity): RecordModel {
    const identifier = serializeRecordIdentity(identity);
    const record = this._factory.create(identity);

    this._map[identifier] = record;

    return record;
  }
}
