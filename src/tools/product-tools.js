import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (overrides environment variable)'),
});

const productListSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (overrides environment variable)'),
  limit: z.number().max(250).default(50).describe('Number of products to return'),
  handle: z.string().optional().describe('Filter by product handle'),
  subscription_defaults: z.boolean().optional().describe('Include subscription defaults'),
});

const productSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (overrides environment variable)'),
  productId: z.string().describe('The product ID'),
});

export const productTools = [
  {
    name: 'get_products',
    description: 'Get products available for subscription',
    inputSchema: productListSchema,
    execute: async (client, args) => {
      const products = await client.getProducts(args);
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
      const { productId } = args;
      const product = await client.getProduct(productId);
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