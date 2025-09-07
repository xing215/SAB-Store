const express = require('express');

// Import route modules
const dashboardRoutes = require('./admin/dashboard');
const ordersRoutes = require('./admin/orders');
const productsRoutes = require('./admin/products');
const exportsRoutes = require('./admin/exports');

const router = express.Router();

// Mount route modules
router.use('/dashboard', dashboardRoutes);
router.use('/orders', ordersRoutes);
router.use('/products', productsRoutes);
router.use('/export', exportsRoutes);

/**
 * SELLER MANAGEMENT - DEPRECATED
 * 
 * The following seller management endpoints have been replaced by Better-Auth admin plugin:
 * 
 * Better-Auth provides these endpoints automatically:
 * - POST   /api/auth/admin/create-user     (Create seller: role: 'seller')
 * - GET    /api/auth/admin/list-users      (List sellers: filterField: 'role', filterValue: 'seller')  
 * - POST   /api/auth/admin/set-role        (Update seller role)
 * - POST   /api/auth/admin/set-user-password (Update seller password)
 * - POST   /api/auth/admin/remove-user     (Delete seller)
 * - POST   /api/auth/admin/ban-user        (Ban seller)
 * - POST   /api/auth/admin/unban-user      (Unban seller)
 * 
 * Frontend should use authClient.admin.* methods instead of custom API calls.
 * 
 * Example usage:
 * - Create: await authClient.admin.createUser({email, password, name, role: 'seller'})
 * - List: await authClient.admin.listUsers({query: {filterField: 'role', filterValue: 'seller'}})
 * - Update role: await authClient.admin.setRole({userId, role})
 * - Delete: await authClient.admin.removeUser({userId})
 * 
 * See Better-Auth admin documentation: https://www.better-auth.com/docs/plugins/admin
 */

module.exports = router;
