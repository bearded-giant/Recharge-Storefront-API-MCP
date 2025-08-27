import { z } from 'zod';

const baseSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
});

const orderListSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  status: z.enum(['queued', 'processing', 'shipped', 'cancelled', 'refunded']).optional().describe('Filter by order status'),
  limit: z.number().max(250).default(50).describe('Number of orders to return'),
  page: z.number().default(1).describe('Page number for pagination'),
});

const orderSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  order_id: z.string().describe('The order ID'),
});

export const orderTools = [
  {
    name: 'get_orders',
    description: 'Get all orders for a specific customer',
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
      const { order_id } = args;
      const order = await client.getOrder(order_id);
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