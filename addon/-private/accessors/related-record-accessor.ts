import {
  Record,
  RecordIdentity,
  RequestOptions,
  cloneRecordIdentity,
  FindRelatedRecordTerm
} from '@orbit/data';

import Store from '../store';
import Model from '../model';

export class RelatedRecordAccessor<
  T extends Model = Model
> extends FindRelatedRecordTerm {
  #store: Store;

  constructor(store: Store, identity: RecordIdentity, relationship: string) {
    super(cloneRecordIdentity(identity), relationship);
    this.#store = store;
  }

  async replace(record: T | null, options?: RequestOptions): Promise<void> {
    const { record: identity, relationship } = this.expression;
    await this.#store.update(
      (t) =>
        t.replaceRelatedRecord(
          identity,
          relationship,
          record ? cloneRecordIdentity(record) : null
        ),
      options
    );
  }

  raw(): Record | null | undefined {
    const { record: identity, relationship } = this.expression;
    return this.#store.source.cache.getRelatedRecordSync(
      identity,
      relationship
    );
  }

  peek(): T | null | undefined {
    const record = this.raw();

    if (record) {
      return this.#store.cache.lookup(record) as T | null;
    }

    return record;
  }

  query(options?: RequestOptions): Promise<T | null> {
    return this.#store.query(
      this.toQueryExpression(),
      options
    ) as Promise<T | null>;
  }
}
