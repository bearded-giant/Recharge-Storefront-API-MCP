import { z } from 'zod';

const baseSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const subscriptionListSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  status: z.enum(['active', 'cancelled', 'expired']).optional().describe('Filter by subscription status'),
  limit: z.number().max(250).default(50).describe('Number of subscriptions to return'),
  page: z.number().default(1).describe('Page number for pagination'),
});

const subscriptionSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscription_id: z.string().describe('The subscription ID'),
});

const updateSubscriptionSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscription_id: z.string().describe('The subscription ID'),
  next_charge_scheduled_at: z.string().optional().describe('Next charge date (ISO format)'),
  order_interval_frequency: z.number().optional().describe('Order interval frequency (e.g., 1, 2, 3)'),
  order_interval_unit: z.enum(['day', 'week', 'month']).optional().describe('Order interval unit'),
  quantity: z.number().optional().describe('Subscription quantity'),
  variant_id: z.number().optional().describe('Product variant ID'),
  properties: z.array(z.object({
    name: z.string(),
    value: z.string(),
  })).optional().describe('Product properties'),
});

const skipSubscriptionSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscription_id: z.string().describe('The subscription ID'),
  date: z.string().describe('Date to skip (YYYY-MM-DD format)'),
});

const unskipSubscriptionSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscription_id: z.string().describe('The subscription ID'),
  date: z.string().describe('Date to unskip (YYYY-MM-DD format)'),
});

const swapSubscriptionSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscription_id: z.string().describe('The subscription ID'),
  variant_id: z.number().describe('New variant ID to swap to'),
  quantity: z.number().optional().describe('New quantity'),
});

const cancelSubscriptionSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscription_id: z.string().describe('The subscription ID'),
  cancellation_reason: z.string().optional().describe('Reason for cancellation'),
  cancellation_reason_comments: z.string().optional().describe('Additional comments for cancellation'),
});

const setNextChargeDateSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscription_id: z.string().describe('The subscription ID'),
  date: z.string().describe('Next charge date (YYYY-MM-DD format)'),
});

const activateSubscriptionSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscription_id: z.string().describe('The subscription ID'),
});

const createSubscriptionSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  address_id: z.string().describe('The address ID for the subscription'),
  next_charge_scheduled_at: z.string().describe('Next charge date (YYYY-MM-DD format)'),
  order_interval_frequency: z.number().describe('Order interval frequency (e.g., 1, 2, 3)'),
  order_interval_unit: z.enum(['day', 'week', 'month']).describe('Order interval unit'),
  quantity: z.number().describe('Subscription quantity'),
  variant_id: z.number().describe('Product variant ID'),
  properties: z.array(z.object({
    name: z.string(),
    value: z.string(),
  })).optional().describe('Product properties'),
});

export const subscriptionTools = [
  {
    name: 'get_subscriptions',
    description: 'Get subscriptions for a specific customer',
    inputSchema: subscriptionListSchema,
    execute: async (client, args) => {
      const subscriptions = await client.getSubscriptions(args);
      return {
        content: [
          {
            type: 'text',
            text: `Subscriptions:\n${JSON.stringify(subscriptions, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'create_subscription',
    description: 'Create a new subscription',
    inputSchema: createSubscriptionSchema,
    execute: async (client, args) => {
      const subscriptionData = { ...args };
      delete subscriptionData.customer_id;
      delete subscriptionData.session_token;
      delete subscriptionData.merchant_token;
      delete subscriptionData.store_url;
      delete subscriptionData.customer_email;
      const subscription = await client.createSubscription(subscriptionData);
      return {
        content: [
          {
            type: 'text',
            text: `Created Subscription:\n${JSON.stringify(subscription, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_subscription',
    description: 'Get detailed information about a specific subscription',
    inputSchema: subscriptionSchema,
    execute: async (client, args) => {
      const { subscription_id } = args;
      const subscription = await client.getSubscription(subscription_id);
      return {
        content: [
          {
            type: 'text',
            text: `Subscription Details:\n${JSON.stringify(subscription, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'update_subscription',
    description: 'Update subscription details like frequency, quantity, or next charge date',
    inputSchema: updateSubscriptionSchema,
    execute: async (client, args) => {
      const { subscription_id } = args;
      const updateData = { ...args };
      delete updateData.subscription_id;
      delete updateData.customer_id;
      delete updateData.session_token;
      delete updateData.merchant_token;
      delete updateData.store_url;
      delete updateData.customer_email;
      const updatedSubscription = await client.updateSubscription(subscription_id, updateData);
      return {
        content: [
          {
            type: 'text',
            text: `Updated Subscription:\n${JSON.stringify(updatedSubscription, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'skip_subscription',
    description: 'Skip a subscription delivery for a specific date',
    inputSchema: skipSubscriptionSchema,
    execute: async (client, args) => {
      const { subscription_id, date } = args;
      const result = await client.skipSubscription(subscription_id, date);
      return {
        content: [
          {
            type: 'text',
            text: `Skipped Subscription:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'unskip_subscription',
    description: 'Unskip a previously skipped subscription delivery',
    inputSchema: unskipSubscriptionSchema,
    execute: async (client, args) => {
      const { subscription_id, date } = args;
      const result = await client.unskipSubscription(subscription_id, date);
      return {
        content: [
          {
            type: 'text',
            text: `Unskipped Subscription:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'swap_subscription',
    description: 'Swap the variant of a subscription',
    inputSchema: swapSubscriptionSchema,
    execute: async (client, args) => {
      const { subscription_id } = args;
      const swapData = { ...args };
      delete swapData.subscription_id;
      delete swapData.customer_id;
      delete swapData.session_token;
      delete swapData.merchant_token;
      delete swapData.store_url;
      delete swapData.customer_email;
      const swappedSubscription = await client.swapSubscription(subscription_id, swapData);
      return {
        content: [
          {
            type: 'text',
            text: `Swapped Subscription Product:\n${JSON.stringify(swappedSubscription, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'cancel_subscription',
    description: 'Cancel a subscription',
    inputSchema: cancelSubscriptionSchema,
    execute: async (client, args) => {
      const { subscription_id } = args;
      const cancelData = { ...args };
      delete cancelData.subscription_id;
      delete cancelData.customer_id;
      delete cancelData.session_token;
      delete cancelData.merchant_token;
      delete cancelData.store_url;
      delete cancelData.customer_email;
      const cancelledSubscription = await client.cancelSubscription(subscription_id, cancelData);
      return {
        content: [
          {
            type: 'text',
            text: `Cancelled Subscription:\n${JSON.stringify(cancelledSubscription, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'activate_subscription',
    description: 'Activate a cancelled subscription',
    inputSchema: activateSubscriptionSchema,
    execute: async (client, args) => {
      const { subscription_id } = args;
      const activatedSubscription = await client.activateSubscription(subscription_id);
      return {
        content: [
          {
            type: 'text',
            text: `Activated Subscription:\n${JSON.stringify(activatedSubscription, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'set_subscription_next_charge_date',
    description: 'Set the next charge date for a subscription',
    inputSchema: setNextChargeDateSchema,
    execute: async (client, args) => {
      const { subscription_id, date } = args;
      const updatedSubscription = await client.setNextChargeDate(subscription_id, date);
      return {
        content: [
          {
            type: 'text',
            text: `Updated Subscription Next Charge Date:\n${JSON.stringify(updatedSubscription, null, 2)}`,
          },
        ],
      };
    },
  },
];