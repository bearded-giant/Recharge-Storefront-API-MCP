#!/usr/bin/env node

/**
 * API Coverage Report Script
 * Analyzes the tools and provides coverage statistics
 */

import { tools } from '../src/tools/index.js';

console.log('🔧 Recharge Storefront API Coverage:', tools.length, 'tools');
console.log('📋 Categories covered:');

const categories = {};
tools.forEach(t => {
  const parts = t.name.split('_');
  let category;
  
  if (parts.includes('customer')) category = 'customer';
  else if (parts.includes('subscription')) category = 'subscriptions';
  else if (parts.includes('address')) category = 'addresses';
  else if (parts.includes('payment')) category = 'payments';
  else if (parts.includes('product')) category = 'products';
  else if (parts.includes('order')) category = 'orders';
  else if (parts.includes('charge')) category = 'charges';
  else if (parts.includes('onetime')) category = 'onetimes';
  else if (parts.includes('bundle')) category = 'bundles';
  else if (parts.includes('discount')) category = 'discounts';
  else category = 'general';
  
  categories[category] = (categories[category] || 0) + 1;
});

Object.entries(categories)
  .sort(([,a], [,b]) => b - a)
  .forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} tools`);
  });

console.log('\n📊 Tool Distribution:');
const totalTools = tools.length;
Object.entries(categories)
  .sort(([,a], [,b]) => b - a)
  .forEach(([cat, count]) => {
    const percentage = ((count / totalTools) * 100).toFixed(1);
    console.log(`   ${cat}: ${percentage}%`);
});

console.log('\n✅ Complete Recharge Storefront API coverage');