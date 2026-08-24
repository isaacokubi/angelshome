module.exports = function adminMiddleware(req, res, next) {
  const role = req.user?.role || req.admin?.role;

  if (role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};
