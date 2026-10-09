// Shared toJSON: expose `id`, hide _id/__v and any sensitive fields.
module.exports = function jsonPlugin(schema, hidden = []) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
      ret.id = String(ret._id);
      delete ret._id;
      hidden.forEach((k) => delete ret[k]);
      return ret;
    },
  });
};
