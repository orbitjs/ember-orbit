import { RecordIdentity, cloneRecordIdentity } from '@orbit/data';
import { DEBUG } from '@glimmer/env';

import Model from './model';

export class Relation {
  readonly name: string;
  readonly owner: Model;

  constructor(owner: Model, name: string) {
    this.name = name;
    this.owner = owner;
  }
}

export class HasOneRelation extends Relation {
  get value(): Model | null {
    return (
      this.owner.store.cache.peekRelatedRecord(
        this.owner.identity,
        this.name
      ) || null
    );
  }

  query(options?: object): Promise<Model | null> {
    return this.owner.store.query(
      q => q.findRelatedRecord(this.owner.identity, this.name),
      options
    );
  }

  async replace(
    record: RecordIdentity | null,
    options?: object
  ): Promise<void> {
    await this.owner.store.update(
      t =>
        t.replaceRelatedRecord(
          this.owner.identity,
          this.name,
          record ? cloneRecordIdentity(record) : null
        ),
      options
    );
  }
}

export class HasManyRelation extends Relation {
  get value(): Model[] {
    const records =
      this.owner.store.cache.peekRelatedRecords(
        this.owner.identity,
        this.name
      ) || [];

    if (DEBUG) {
      Object.freeze(records);
    }

    return records;
  }

  get ids(): string[] {
    return this.value.map((record: RecordIdentity) => record.id);
  }

  query(options?: object): Promise<Model[]> {
    return this.owner.store.query(
      q => q.findRelatedRecords(this.owner.identity, this.name),
      options
    );
  }

  async add(record: RecordIdentity, options?: object): Promise<void> {
    await this.owner.store.update(
      t =>
        t.addToRelatedRecords(
          this.owner.identity,
          this.name,
          cloneRecordIdentity(record)
        ),
      options
    );
  }

  async remove(record: RecordIdentity, options?: object): Promise<void> {
    await this.owner.store.update(
      t =>
        t.removeFromRelatedRecords(
          this.owner.identity,
          this.name,
          cloneRecordIdentity(record)
        ),
      options
    );
  }

  async replace(records: RecordIdentity[], options?: object): Promise<void> {
    await this.owner.store.update(
      t =>
        t.replaceRelatedRecords(
          this.owner.identity,
          this.name,
          records.map(record => cloneRecordIdentity(record))
        ),
      options
    );
  }
}
