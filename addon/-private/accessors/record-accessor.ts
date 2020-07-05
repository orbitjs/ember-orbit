import {
  RecordIdentity,
  RequestOptions,
  Record,
  cloneRecordIdentity,
  FindRecordTerm
} from '@orbit/data';
import { Dict } from '@orbit/utils';

import Store from '../store';
import Model from '../model';
import normalizeRecordProperties from '../utils/normalize-record-properties';

export class RecordAccessor<T extends Model = Model> extends FindRecordTerm {
  #store: Store;

  constructor(store: Store, identity: RecordIdentity) {
    super(cloneRecordIdentity(identity));
    this.#store = store;
  }

  async update(
    properties: Dict<unknown> = {},
    options?: RequestOptions
  ): Promise<T> {
    const { record: identity } = this.expression;
    const record = normalizeRecordProperties(this.#store.source.schema, {
      ...properties,
      ...identity
    });
    if (record.attributes && !record.relationships && !record.keys) {
      const attributeNames = Object.keys(record.attributes);
      await this.#store.update(
        (t) =>
          attributeNames.map((attribute) =>
            t.replaceAttribute(identity, attribute, properties[attribute])
          ),
        options
      );
    } else {
      await this.#store.update((t) => t.updateRecord(record), options);
    }

    return this.peek() as T;
  }

  /**
   * Removes a record from the store
   * @method remove
   * @param {object} options
   */
  async remove(options?: RequestOptions): Promise<void> {
    const { record: identity } = this.expression;
    await this.#store.update((t) => t.removeRecord(identity), options);
  }

  unload(): void {
    const { record: identity } = this.expression;
    this.#store.cache.unload(identity);
  }

  raw(): Record | undefined {
    const { record: identity } = this.expression;
    return this.#store.source.cache.getRecordSync(identity);
  }

  peek(): T | undefined {
    const record = this.raw();

    if (record) {
      return this.#store.cache.lookup(record) as T;
    }

    return undefined;
  }

  query(options?: RequestOptions): Promise<T> {
    return this.#store.query(this.toQueryExpression(), options) as Promise<T>;
  }
}
