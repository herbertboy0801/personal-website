// admin/auth-config.js
// Authentication configuration for admin panel
// To change the password, run:
//   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YOUR_NEW_PASSWORD', 10));"
// Then replace the adminPasswordHash value below.

module.exports = {
  sessionSecret: 'fa969eee1edc82afddefecc02f25ff4781abaa8cdd19043707d28a6f64fc5fbd',
  adminUsername: 'admin',
  // Default password: admin123 (CHANGE THIS!)
  adminPasswordHash: '$2b$10$NwRQtww6/u6OmLBFO.9BS.0soc6BUl29XeZSZJdCJh2AW8WMvSVt6'
};
