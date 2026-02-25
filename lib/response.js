export function json(res, data, status = 200) {
  res.status(status).json(data);
}

export function error(res, message, status = 500) {
  res.status(status).json({ message });
}

export function requireMethod(req, res, methods) {
  const allowed = Array.isArray(methods) ? methods : [methods];
  if (!allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '));
    res.status(405).json({ message: `Method ${req.method} not allowed` });
    return false;
  }
  return true;
}
