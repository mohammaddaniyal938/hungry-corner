function sendSuccess(res, { status = 200, message = 'Success', data = null, pagination } = {}) {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  return res.status(status).json(body);
}
const created = (res, message, data) => sendSuccess(res, { status: 201, message, data });
const ok = (res, message, data, pagination) => sendSuccess(res, { message, data, pagination });

module.exports = { sendSuccess, created, ok };
