const { assert } = Ember;

export default Ember.Object.extend({
  OrbitBucketClass: null,
  orbitBucket: null,
  orbitBucketOptions: null,

  init() {
    this._super(...arguments);

    if (!this.orbitBucket) {
      let OrbitBucketClass = this.OrbitBucketClass;
      if (OrbitBucketClass.wrappedFunction) {
        OrbitBucketClass = OrbitBucketClass.wrappedFunction;
      }

      assert('OrbitBucketClass or orbitBucket must be specified to construct a Bucket.', OrbitBucketClass);

      let options = this.orbitBucketOptions || {};
      this.orbitBucket = new OrbitBucketClass(options);
    }
  }
});
