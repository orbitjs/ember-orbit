module.exports = {
  env: {
    'embertest': true
  },
  globals: {
    $: true,
    andThen: true,
    click: true,
    currentPath: true,
    currentRouteName: true,
    currentURL: true,
    fillIn: true,
    find: true,
    findWithAssert: true,
    keyEvent: true,
    triggerEvent: true,
    visit: true,
    wait: true,

    // Remove after updating tests
    Ember: true,
    deepEqual: true,
    equal: true,
    module: true,
    ok: true,
    test: true,
    throws: true
  }
};
