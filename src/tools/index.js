import { customerTools } from './customer-tools.js';
import { subscriptionTools } from './subscription-tools.js';
import { addressTools } from './address-tools.js';
import { orderTools } from './order-tools.js';
import { paymentTools } from './payment-tools.js';
import { productTools } from './product-tools.js';
import { discountTools } from './discount-tools.js';
import { bundleSelectionTools } from './bundle-tools.js';
import { chargeTools } from './charge-tools.js';
import { onetimeTools } from './onetimes-tools.js';
import { sessionTools } from './session-tools.js';
import { storeTools } from './store-tools.js';
import { settingsTools } from './settings-tools.js';
import { notificationTools } from './notification-tools.js';
import { asyncBatchTools } from './async-batch-tools.js';
import { shopifyConnectorTools } from './shopify-connector-tools.js';

export const tools = [
  ...customerTools,
  ...subscriptionTools,
  ...addressTools,
  ...orderTools,
  ...paymentTools,
  ...productTools,
  ...discountTools,
  ...bundleSelectionTools,
  ...chargeTools,
  ...onetimeTools,
  ...sessionTools,
  ...storeTools,
  ...settingsTools,
  ...notificationTools,
  ...asyncBatchTools,
  ...shopifyConnectorTools,
];