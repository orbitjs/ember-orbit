import {
  Record,
  RequestOptions,
  buildQuery,
  FindRecordsTerm
} from '@orbit/data';
import { Dict } from '@orbit/utils';

import Store from '../store';
import Model from '../model';
import normalizeRecordProperties from '../utils/normalize-record-properties';
import LiveQuery from '../live-query';

export class RecordsAccessor<T extends Model = Model> extends FindRecordsTerm {
  #store: Store;

  constructor(store: Store, type: string) {
    super(type);
    this.#store = store;
  }

  query(options?: RequestOptions): Promise<T[]> {
    return this.#store.query(this.toQueryExpression(), options) as Promise<T[]>;
  }

  raw(): Record[] | undefined {
    return this.#store.source.cache.query(this.toQueryExpression()) as Record[];
  }

  live(options?: RequestOptions): LiveQuery {
    const query = buildQuery(this.toQueryExpression(), options);
    const liveQuery = this.#store.source.cache.liveQuery(query);

    return new LiveQuery({ liveQuery, cache: this.#store.cache, query });
  }
}

export class RecordsMutableAccessor<
  T extends Model = Model
> extends RecordsAccessor<T> {
  #store: Store;

  constructor(store: Store, type: string) {
    super(store, type);
    this.#store = store;
  }

  raw(): Record[] | undefined {
    const { type } = this.expression;
    return this.#store.source.cache.getRecordsSync(type);
  }

  peek(): T[] | undefined {
    const records = this.raw();

    if (records) {
      return this.#store.cache.lookup(records) as T[];
    }

    return undefined;
  }

  /**
   * Adds a record of a given type to the store
   * @method add
   * @param {object} properties
   * @param {object} options
   */
  async add(
    properties: Dict<unknown> = {},
    options?: RequestOptions
  ): Promise<T> {
    const { type } = this.expression;
    const record = normalizeRecordProperties(this.#store.source.schema, {
      ...properties,
      type
    });
    await this.#store.update((t) => t.addRecord(record), options);

    return this.#store.record(record).peek() as T;
  }
}
