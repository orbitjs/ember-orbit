function objectValues(object) {
  return Object.keys(object).map(k => object[k]);
}

let implementation = Object.values || objectValues;
export default implementation;
