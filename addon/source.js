import OrbitSource from 'orbit/source';

const { assert } = Ember;

export default Ember.Object.extend({
  OrbitSourceClass: OrbitSource,
  orbitSource: null,
  orbitSourceOptions: null,
  keyMap: null,
  schema: null,
  bucket: null,
  coordinator: null,

  init() {
    this._super(...arguments);

    assert("`schema` must be injected onto a Source", this.schema);
    assert("`keyMap` must be injected onto a Source", this.keyMap);

    if (!this.orbitSource) {
      let OrbitSourceClass = this.OrbitSourceClass;
      if (OrbitSourceClass.wrappedFunction) {
        OrbitSourceClass = OrbitSourceClass.wrappedFunction;
      }

      let options = this.orbitSourceOptions || {};
      options.schema = this.schema.orbitSchema;
      options.keyMap = this.keyMap.orbitKeyMap;
      if (this.bucket) {
        options.bucket = this.bucket.orbitBucket;
      }

      this.orbitSource = new OrbitSourceClass(options);
    }

    this.transformLog = this.orbitSource.transformLog;
    this.requestQueue = this.orbitSource.requestQueue;
    this.syncQueue = this.orbitSource.syncQueue;

    if (this.coordinator) {
      this.coordinator.addSource(this);
    }
  },

  willDestroy() {
    if (this.coordinator) {
      this.coordinator.removeSource(this);
    }
  },

  on() {
    return this.orbitSource.on(...arguments);
  },

  off() {
    return this.orbitSource.off(...arguments);
  },

  one() {
    return this.orbitSource.one(...arguments);
  },

  pull() {
    return this.orbitSource.pull(...arguments);
  },

  push() {
    return this.orbitSource.push(...arguments);
  },

  query() {
    return this.orbitSource.query(...arguments);
  },

  sync() {
    return this.orbitSource.sync(...arguments);
  },

  update() {
    return this.orbitSource.update(...arguments);
  }
});
