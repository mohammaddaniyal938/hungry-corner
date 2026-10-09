function getPagination({ page = 1, limit = 10 } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  return { page: p, limit: l, skip: (p - 1) * l };
}
const buildPagination = ({ page, limit }, total) => ({
  page, limit, total, totalPages: Math.ceil(total / limit),
});
module.exports = { getPagination, buildPagination };
