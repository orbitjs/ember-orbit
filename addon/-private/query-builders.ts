import { deepMerge } from '@orbit/utils';
import {
  RecordIdentity,
  FindRecordTerm,
  FindRecordsTerm,
  FindRelatedRecordTerm,
  FindRelatedRecordsTerm
} from '@orbit/data';

import Store from './store';
import Model from './model';

export class FindRecordQueryBuilder extends FindRecordTerm {
  store: Store;
  _options = {};

  constructor(store: Store, record: RecordIdentity) {
    super(record);
    this.store = store;
  }

  options(options: object) {
    deepMerge(this._options, options);
    return this;
  }

  then(...args: any[]): Promise<Model> {
    return this._promise.then(...args);
  }

  catch(cb: any) {
    return this._promise.catch(cb);
  }

  finally(cb: any) {
    return this._promise.finally(cb);
  }

  peek(): Model | undefined {
    return this.store.cache.query(
      this.toQueryExpression(),
      this._options
    ) as Model;
  }

  private get _promise() {
    return this.store.query(this.toQueryExpression(), this._options);
  }
}

export class FindRecordsQueryBuilder extends FindRecordsTerm {
  store: Store;
  _options = {};
  _live = false;

  constructor(store: Store, typeOrIdentities?: string | RecordIdentity[]) {
    super(typeOrIdentities);
    this.store = store;
  }

  options(options: object) {
    deepMerge(this._options, options);
    return this;
  }

  live() {
    this._live = true;
    return this;
  }

  then(...args: any[]): Promise<Model[]> {
    return this._promise.then(...args);
  }

  catch(cb: any) {
    return this._promise.catch(cb);
  }

  finally(cb: any) {
    return this._promise.finally(cb);
  }

  peek(): Model[] | any {
    if (this._live) {
      return this.store.cache.liveQuery(
        this.toQueryExpression(),
        this._options
      );
    }
    return this.store.cache.query(this.toQueryExpression(), this._options);
  }

  private get _promise() {
    return this.store
      .query(this.toQueryExpression(), this._options)
      .then(result => {
        if (this._live) {
          return this.peek();
        }
        return result;
      });
  }
}

export class FindRelatedRecordQueryBuilder extends FindRelatedRecordTerm {
  store: Store;
  _options = {};

  constructor(store: Store, record: RecordIdentity, relationship: string) {
    super(record, relationship);
    this.store = store;
  }

  options(options: object) {
    deepMerge(this._options, options);
    return this;
  }

  then(...args: any[]): Promise<Model> {
    return this._promise.then(...args);
  }

  catch(cb: any) {
    return this._promise.catch(cb);
  }

  finally(cb: any) {
    return this._promise.finally(cb);
  }

  peek(): Model | null {
    return this.store.cache.query(
      this.toQueryExpression(),
      this._options
    ) as Model | null;
  }

  private get _promise() {
    return this.store.query(this.toQueryExpression(), this._options);
  }
}

export class FindRelatedRecordsQueryBuilder extends FindRelatedRecordsTerm {
  store: Store;
  _options = {};
  _live = false;

  constructor(store: Store, record: RecordIdentity, relationship: string) {
    super(record, relationship);
    this.store = store;
  }

  options(options: object) {
    deepMerge(this._options, options);
    return this;
  }

  live() {
    this._live = true;
    return this;
  }

  then(...args: any[]): Promise<Model[]> {
    return this._promise.then(...args);
  }

  catch(cb: any) {
    return this._promise.catch(cb);
  }

  finally(cb: any) {
    return this._promise.finally(cb);
  }

  peek(): Model[] | any {
    if (this._live) {
      return this.store.cache.liveQuery(
        this.toQueryExpression(),
        this._options
      );
    }
    return this.store.cache.query(
      this.toQueryExpression(),
      this._options
    ) as Model[];
  }

  private get _promise() {
    return this.store
      .query(this.toQueryExpression(), this._options)
      .then(result => {
        if (this._live) {
          return this.peek();
        }
        return result;
      });
  }
}
