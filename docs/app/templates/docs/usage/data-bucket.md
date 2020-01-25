# Defining a data bucket

Data buckets are used by sources and key maps to load and persist state. To
create a new bucket, run the generator:

```
ember g data-bucket main
```

By default this will create a new bucket factory based on `@orbit/indexeddb-bucket`.
It will also create an initializer that injects this bucket into all your
sources and key maps.