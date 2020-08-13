import {
  Record,
  RequestOptions,
  RecordIdentity,
  cloneRecordIdentity,
  buildQuery,
  FindRelatedRecordsTerm
} from '@orbit/data';

import Store from '../store';
import Model from '../model';
import LiveQuery from '../live-query';

export class RelatedRecordsAccessor<
  T extends Model = Model
> extends FindRelatedRecordsTerm {
  #store: Store;

  constructor(store: Store, identity: RecordIdentity, relationship: string) {
    super(cloneRecordIdentity(identity), relationship);
    this.#store = store;
  }

  query(options?: RequestOptions): Promise<T[]> {
    return this.#store.query(this.toQueryExpression(), options) as Promise<T[]>;
  }

  raw(): Record[] | undefined {
    return this.#store.source.cache.query(this.toQueryExpression()) as Record[];
  }

  live(options?: RequestOptions): LiveQuery<T> {
    const query = buildQuery(this.toQueryExpression(), options);
    const liveQuery = this.#store.source.cache.liveQuery(query);

    return new LiveQuery({ liveQuery, cache: this.#store.cache, query });
  }
}

export class RelatedRecordsMutableAccessor<
  T extends Model = Model
> extends RelatedRecordsAccessor<T> {
  #store: Store;

  constructor(store: Store, identity: RecordIdentity, relationship: string) {
    super(store, identity, relationship);
    this.#store = store;
  }

  raw(): Record[] | undefined {
    const { record: identity, relationship } = this.expression;
    return this.#store.source.cache.getRelatedRecordsSync(
      identity,
      relationship
    );
  }

  peek(): T[] | undefined {
    const records = this.raw();

    if (records) {
      return this.#store.cache.lookup(records) as T[];
    }

    return undefined;
  }

  async add(record: RecordIdentity, options?: RequestOptions): Promise<void> {
    const { record: identity, relationship } = this.expression;
    await this.#store.update(
      (t) =>
        t.addToRelatedRecords(
          identity,
          relationship,
          cloneRecordIdentity(record)
        ),
      options
    );
  }

  async remove(
    record: RecordIdentity,
    options?: RequestOptions
  ): Promise<void> {
    const { record: identity, relationship } = this.expression;
    await this.#store.update(
      (t) =>
        t.removeFromRelatedRecords(
          identity,
          relationship,
          cloneRecordIdentity(record)
        ),
      options
    );
  }

  async replace(
    records: RecordIdentity[],
    options?: RequestOptions
  ): Promise<void> {
    const { record: identity, relationship } = this.expression;
    await this.#store.update(
      (t) =>
        t.replaceRelatedRecords(
          identity,
          relationship,
          records.map((record) => cloneRecordIdentity(record))
        ),
      options
    );
  }
}
