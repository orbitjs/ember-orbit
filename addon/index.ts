import 'reflect-metadata';
export { default as CoordinatorFactory } from './-private/factories/coordinator-factory';
export { default as KeyMapFactory } from './-private/factories/key-map-factory';
export { default as SchemaFactory } from './-private/factories/schema-factory';
export { default as MemorySourceFactory } from './-private/factories/memory-source-factory';
export { default as StoreFactory } from './-private/factories/memory-source-factory';
export { default as attr } from './-private/fields/attr';
export { default as hasMany } from './-private/fields/has-many';
export { default as hasOne } from './-private/fields/has-one';
export { default as key } from './-private/fields/key';
export { default as Cache } from './-private/cache';
export { default as Model } from './-private/model';
export { default as Store } from './-private/store';
export { LiveQuery } from './-private/live-query';
export { useLiveQuery } from './-private/use-live-query';
export { use } from './-private/utils/use';

// Provide `belongsTo` as an alias to `hasOne`
export { default as belongsTo } from './-private/fields/has-one';
