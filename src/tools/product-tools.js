import { z } from 'zod';

const baseSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
});

const productListSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  limit: z.number().max(250).default(50).describe('Number of products to return'),
  handle: z.string().optional().describe('Filter by product handle'),
  subscription_defaults: z.boolean().optional().describe('Include subscription defaults'),
});

const productSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  product_id: z.string().describe('The product ID'),
});

export const productTools = [
  {
    name: 'get_products',
    description: 'Get products available for subscription',
    inputSchema: productListSchema,
    execute: async (client, args) => {
      const { session_token, merchant_token, store_url, customer_id, ...params } = args;
      const products = await client.getProducts(params);
      return {
        content: [
          {
            type: 'text',
            text: `Products:\n${JSON.stringify(products, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_product',
    description: 'Get detailed information about a specific product',
    inputSchema: productSchema,
    execute: async (client, args) => {
      const { product_id, ...otherArgs } = args;
      const product = await client.getProduct(product_id);
      return {
        content: [
          {
            type: 'text',
            text: `Product Details:\n${JSON.stringify(product, null, 2)}`,
          },
        ],
      };
    },
  },
];