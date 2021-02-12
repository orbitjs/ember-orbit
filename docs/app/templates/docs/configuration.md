# Customizing EO

The types, collections, and services used by EO can all be customized for
your application via settings under the `orbit` key in `config/environment`:

```js
module.exports = function(environment) {
  let ENV = {
    // ... other settings here

    // Default Orbit settings (any of which can be overridden)
    orbit: {
      types: {
        bucket: 'data-bucket',
        model: 'data-model',
        source: 'data-source',
        strategy: 'data-strategy'
      },
      collections: {
        buckets: 'data-buckets',
        models: 'data-models',
        sources: 'data-sources',
        strategies: 'data-strategies'
      },
      services: {
        store: 'store',
        coordinator: 'data-coordinator',
        schema: 'data-schema',
        keyMap: 'data-key-map'
      },
      skipStoreService: false,
      skipCoordinatorService: false,
      skipSchemaService: false,
      skipKeyMapService: false
    }
  };

  return ENV;
};
```