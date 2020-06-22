import { run } from '@ember/runloop';
import { getOwner } from '@ember/application';
import { registerDestructor } from 'ember-destroyable-polyfill';

import { memoComputation } from './tracking';

const REGISTERED_USABLES = new Set();

(run as any).backburner.on('end', () => {
  REGISTERED_USABLES.forEach((usable: any) => usable.state);
});

const USABLE_MANAGERS = new WeakMap();
const USABLE_MANAGER_INSTANCES = new WeakMap();

export function setUsableManager(obj, manager) {
  USABLE_MANAGERS.set(obj, manager);
}

function getUsableManagerFactory(_obj) {
  let obj = _obj;
  let factory;

  while (obj !== null) {
    factory = USABLE_MANAGERS.get(obj);

    if (factory === undefined) {
      obj = Object.getPrototypeOf(obj);
    } else {
      break;
    }
  }

  return factory;
}

function getUsableManager(obj, owner) {
  let managers = USABLE_MANAGER_INSTANCES.get(owner);
  let factory = getUsableManagerFactory(obj);

  if (factory === undefined) {
    return;
  }

  if (managers === undefined) {
    managers = new WeakMap();
    USABLE_MANAGER_INSTANCES.set(owner, managers);
  }

  let manager = managers.get(factory);

  if (manager === undefined) {
    manager = factory(owner);
    managers.set(factory, manager);
  }

  return manager;
}

function createUsable(context, definitionOrThunk) {
  let instance;
  let destroyed = false;
  let owner = getOwner(context);

  let manager = getUsableManager(definitionOrThunk, owner);
  let isStatic = manager !== undefined;

  let createOrUpdate = memoComputation(() => {
    let definition = isStatic ? definitionOrThunk : definitionOrThunk();

    if (manager === undefined) {
      manager = getUsableManager(definition, owner);
    }

    if (!instance) {
      instance = manager.createUsable(context, definition, isStatic);
      manager.setupUsable(instance, definition);
    } else {
      manager.updateUsable(instance, definition);
    }
  });

  // bootstrap
  createOrUpdate();

  let api = {
    get state() {
      createOrUpdate();

      return manager.getState(instance);
    },

    teardown() {
      if (destroyed) return;

      REGISTERED_USABLES.delete(this);

      manager.teardownUsable(instance);
      destroyed = true;
    }
  };

  registerDestructor(context, () => api.teardown());

  REGISTERED_USABLES.add(api);

  return api;
}

export function use(
  prototypeOrThis: object,
  keyOrDef: string,
  desc?: PropertyDescriptor
): any {
  if (typeof keyOrDef === 'function' || typeof keyOrDef === 'object') {
    return createUsable(prototypeOrThis, keyOrDef);
  }

  let resources = new WeakMap();
  let { initializer } = desc as any;

  return {
    get() {
      let resource = resources.get(this);

      if (!resource) {
        resource = createUsable(this, initializer.bind(this));
        resources.set(this, resource);
      }

      return resource.state;
    }
  };
}
