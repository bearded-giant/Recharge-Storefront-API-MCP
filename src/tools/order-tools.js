import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const orderListSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  status: z.enum(['queued', 'processing', 'shipped', 'cancelled', 'refunded']).optional().describe('Filter by order status'),
  limit: z.number().max(250).default(50).describe('Number of orders to return'),
  page: z.number().default(1).describe('Page number for pagination'),
});

const orderSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  orderId: z.string().describe('The order ID'),
});

export const orderTools = [
  {
    name: 'get_orders',
    description: 'Get all orders for the current customer',
    inputSchema: orderListSchema,
    execute: async (client, args) => {
      const orders = await client.getOrders(args);
      return {
        content: [
          {
            type: 'text',
            text: `Orders:\n${JSON.stringify(orders, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_order',
    description: 'Get detailed information about a specific order',
    inputSchema: orderSchema,
    execute: async (client, args) => {
      const { orderId } = args;
      const order = await client.getOrder(orderId);
      return {
        content: [
          {
            type: 'text',
            text: `Order Details:\n${JSON.stringify(order, null, 2)}`,
          },
        ],
      };
    },
  },
];