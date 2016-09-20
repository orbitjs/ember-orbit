import OrbitBucket from 'orbit/bucket';
import Bucket from 'ember-orbit/bucket';

module('Unit - Bucket', function() {
  test('can be instantiated from an existing Orbit Bucket', function(assert) {
    const orbitBucket = new OrbitBucket({ name: 'settings' });

    const bucket = Bucket.create({
      orbitBucket
    });

    assert.ok(bucket, 'bucket has been created');
  });

  test('can be instantiated given an OrbitBucketClass', function(assert) {
    const bucket = Bucket.create({
      OrbitBucketClass: OrbitBucket,
      orbitBucketOptions: { name: 'ze-bucket' }
    });

    assert.ok(bucket, 'bucket has been created');
    assert.ok(bucket.orbitBucket instanceof OrbitBucket, 'bucket.orbitBucket has been instantiated from specified class');
    assert.equal(bucket.orbitBucket.name, 'ze-bucket', 'options have been passed to Orbit Bucket');
  });
});
