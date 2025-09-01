import dotenv from 'dotenv';
dotenv.config();

console.log('Environment check:');
console.log('- RECHARGE_ADMIN_TOKEN present:', !!process.env.RECHARGE_ADMIN_TOKEN);
console.log('- Token prefix:', process.env.RECHARGE_ADMIN_TOKEN ? process.env.RECHARGE_ADMIN_TOKEN.substring(0,10) + '...' : 'N/A');
console.log('- Token length:', process.env.RECHARGE_ADMIN_TOKEN ? process.env.RECHARGE_ADMIN_TOKEN.length : 0);
console.log('- RECHARGE_STOREFRONT_DOMAIN:', process.env.RECHARGE_STOREFRONT_DOMAIN || 'Not set');
console.log('- DEBUG:', process.env.DEBUG || 'Not set');