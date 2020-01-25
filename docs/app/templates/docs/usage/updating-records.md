# Updating records

Any records retrieved from a store or its cache will stay sync'd with the
contents of that cache. Each attribute and relationship is a computed property
that has getters and setters which pass through to the underlying store.

Let's say that you find a couple records directly in the store's cache and
want to edit them:

```javascript
let jupiter = store.cache.find('planet', 'jupiter');
let io = store.cache.find('moon', 'io');
let europa = store.cache.find('moon', 'europa');
let sun = store.cache.find('star', 'theSun');

jupiter.set('name', 'JUPITER!');
jupiter.get('moons').pushObject(io);
jupiter.get('moons').removeObject(europa);
jupiter.set('sun', sun);
```

Behind the scenes, these changes each result in a call to `store.update`. Of
course, this method could also be called directly.