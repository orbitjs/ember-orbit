import {
  Record,
  RecordIdentity,
  serializeRecordIdentity,
  deserializeRecordIdentity,
  RecordOperation
} from '@orbit/data';
import IdentityMap, { IdentitySerializer } from '@orbit/identity-map';
import { QueryResultData } from '@orbit/record-cache';
import { registerDestructor } from 'ember-destroyable-polyfill';

import Store from './store';
import Model, { QueryResult } from './model';
import { modelFor } from './model-factory';

export class RecordIdentitySerializer
  implements IdentitySerializer<RecordIdentity> {
  serialize(identity: RecordIdentity) {
    return serializeRecordIdentity(identity);
  }
  deserialize(identifier: string) {
    return deserializeRecordIdentity(identifier);
  }
}

export default class extends IdentityMap<RecordIdentity, Model> {
  #store: Store;

  constructor(store: Store) {
    super({ serializer: new RecordIdentitySerializer() });
    this.#store = store;

    const off = this.#store.source.cache.on(
      'patch',
      generatePatchListener(this)
    );
    registerDestructor(this, () => {
      off();
      this.clear();
    });
  }

  lookup(result: QueryResult<Record>, expressions = 1): QueryResult<Model> {
    if (isQueryResultData(result, expressions)) {
      return (result as QueryResultData[]).map((result) =>
        lookupQueryResultData(this.#store, this, result)
      );
    } else {
      return lookupQueryResultData(this.#store, this, result);
    }
  }

  unload(identity: RecordIdentity): void {
    unload(this, identity);
  }
}

function notifyPropertyChange(
  identityMap: IdentityMap<RecordIdentity, Model>,
  identity: RecordIdentity,
  property: string
): void {
  const record = identityMap.get(identity);

  if (record) {
    Reflect.getMetadata('orbit:notifier', record, property)(record);
  }
}

function unload(
  identityMap: IdentityMap<RecordIdentity, Model>,
  identity: RecordIdentity
): void {
  const record = identityMap.get(identity);
  if (record) {
    record.disconnect();
    identityMap.delete(identity);
  }
}

function generatePatchListener(
  identityMap: IdentityMap<RecordIdentity, Model>
): (operation: RecordOperation) => void {
  return (operation: RecordOperation) => {
    const record = operation.record as Record;
    const { type, id, keys, attributes, relationships } = record;
    const identity = { type, id };

    switch (operation.op) {
      case 'updateRecord':
        for (let properties of [attributes, keys, relationships]) {
          if (properties) {
            for (let property of Object.keys(properties)) {
              if (Object.prototype.hasOwnProperty.call(properties, property)) {
                notifyPropertyChange(identityMap, identity, property);
              }
            }
          }
        }
        break;
      case 'replaceAttribute':
        notifyPropertyChange(identityMap, identity, operation.attribute);
        break;
      case 'replaceKey':
        notifyPropertyChange(identityMap, identity, operation.key);
        break;
      case 'replaceRelatedRecord':
      case 'replaceRelatedRecords':
      case 'addToRelatedRecords':
      case 'removeFromRelatedRecords':
        notifyPropertyChange(identityMap, identity, operation.relationship);
        break;
      case 'removeRecord':
        unload(identityMap, identity);
        break;
    }
  };
}

function lookupQueryResultData(
  store: Store,
  identityMap: IdentityMap<RecordIdentity, Model>,
  result: QueryResultData
): Model | Model[] | null {
  if (Array.isArray(result)) {
    return result.map(
      (identity) => lookupQueryResultData(store, identityMap, identity) as Model
    );
  } else if (result) {
    let record = identityMap.get(result);

    if (!record) {
      record = modelFor({ store, identity: result, mutable: true });
      identityMap.set(result, record);
    }

    return record;
  }

  return null;
}

function isQueryResultData(
  _result: QueryResult<Record>,
  expressions: number
): _result is QueryResultData[] {
  return expressions > 1;
}
