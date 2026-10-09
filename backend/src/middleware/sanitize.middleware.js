// Strips Mongo operator injection ({"$gt": ""}) and dotted keys from body/query/params.
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}

module.exports = (req, _res, next) => {
  ['body', 'query', 'params'].forEach((k) => {
    if (req[k]) req[k] = clean(req[k]);
  });
  next();
};
