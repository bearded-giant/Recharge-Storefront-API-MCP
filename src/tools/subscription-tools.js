import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const subscriptionListSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().describe('Customer ID'),
  status: z.enum(['active', 'cancelled', 'expired']).optional().describe('Filter by subscription status'),
  limit: z.number().max(250).default(50).describe('Number of subscriptions to return'),
  page: z.number().default(1).describe('Page number for pagination'),
});

const subscriptionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscriptionId: z.string().describe('The subscription ID'),
});

const updateSubscriptionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscriptionId: z.string().describe('The subscription ID'),
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
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscriptionId: z.string().describe('The subscription ID'),
  date: z.string().describe('Date to skip (YYYY-MM-DD format)'),
});

const unskipSubscriptionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscriptionId: z.string().describe('The subscription ID'),
  date: z.string().describe('Date to unskip (YYYY-MM-DD format)'),
});

const swapSubscriptionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscriptionId: z.string().describe('The subscription ID'),
  variant_id: z.number().describe('New variant ID to swap to'),
  quantity: z.number().optional().describe('New quantity'),
});

const cancelSubscriptionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscriptionId: z.string().describe('The subscription ID'),
  cancellation_reason: z.string().optional().describe('Reason for cancellation'),
  cancellation_reason_comments: z.string().optional().describe('Additional comments for cancellation'),
});

const setNextChargeDateSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscriptionId: z.string().describe('The subscription ID'),
  date: z.string().describe('Next charge date (YYYY-MM-DD format)'),
});

const pauseSubscriptionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscriptionId: z.string().describe('The subscription ID'),
  pause_reason: z.string().optional().describe('Reason for pausing the subscription'),
});

const activateSubscriptionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscriptionId: z.string().describe('The subscription ID'),
});

const resumeSubscriptionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscriptionId: z.string().describe('The subscription ID'),
});

export const subscriptionTools = [
  {
    name: 'get_customer_subscriptions',
    description: 'Get all subscriptions for the current customer',
    inputSchema: subscriptionListSchema,
    execute: async (client, args) => {
      const { customer_id, ...params } = args;
      const subscriptions = await client.getSubscriptions(customer_id, params);
      return {
        content: [
          {
            type: 'text',
            text: `Customer Subscriptions:\n${JSON.stringify(subscriptions, null, 2)}`,
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
      const { subscriptionId } = args;
      const subscription = await client.getSubscription(subscriptionId);
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
      const { subscriptionId, ...updateData } = args;
      const updatedSubscription = await client.updateSubscription(subscriptionId, updateData);
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
      const { subscriptionId, date } = args;
      const result = await client.skipSubscription(subscriptionId, date);
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
      const { subscriptionId, date } = args;
      const result = await client.unskipSubscription(subscriptionId, date);
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
    name: 'swap_subscription_product',
    description: 'Swap the variant of a subscription',
    inputSchema: swapSubscriptionSchema,
    execute: async (client, args) => {
      const { subscriptionId, ...swapData } = args;
      const swappedSubscription = await client.swapSubscription(subscriptionId, swapData);
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
      const { subscriptionId, ...cancelData } = args;
      const cancelledSubscription = await client.cancelSubscription(subscriptionId, cancelData);
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
      const { subscriptionId } = args;
      const activatedSubscription = await client.activateSubscription(subscriptionId);
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
      const { subscriptionId, date } = args;
      const updatedSubscription = await client.setNextChargeDate(subscriptionId, date);
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
  {
    name: 'pause_subscription',
    description: 'Pause a subscription temporarily',
    inputSchema: pauseSubscriptionSchema,
    execute: async (client, args) => {
      const { subscriptionId, ...pauseData } = args;
      const pausedSubscription = await client.pauseSubscription(subscriptionId, pauseData);
      return {
        content: [
          {
            type: 'text',
            text: `Paused Subscription:\n${JSON.stringify(pausedSubscription, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'resume_subscription',
    description: 'Resume a paused subscription',
    inputSchema: resumeSubscriptionSchema,
    execute: async (client, args) => {
      const { subscriptionId } = args;
      const resumedSubscription = await client.resumeSubscription(subscriptionId);
      return {
        content: [
          {
            type: 'text',
            text: `Resumed Subscription:\n${JSON.stringify(resumedSubscription, null, 2)}`,
          },
        ],
      };
    },
  },
];