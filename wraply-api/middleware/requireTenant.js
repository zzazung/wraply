module.exports = function requireTenant(req, res, next) {

  if (!req.user?.tenantId) {
    return res.status(401).json({ error: "TENANT_REQUIRED" });
  }

  next();
}