function objectValues(object) {
  return Object.keys(object).map(k => object[k]);
}

export default Object.values || objectValues;
