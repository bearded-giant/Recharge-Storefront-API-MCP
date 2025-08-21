import { z } from 'zod';

const onetimeListSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const onetimeSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  onetimeId: z.string().describe('The one-time product ID'),
});

const createOnetimeSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  variant_id: z.number().describe('Variant ID'),
  quantity: z.number().describe('Quantity'),
  next_charge_scheduled_at: z.string().describe('When to add this to next charge (YYYY-MM-DD format)'),
  price: z.number().optional().describe('Price per unit'),
  properties: z.array(z.object({
    name: z.string(),
    value: z.string(),
  })).optional().describe('Product properties'),
});

const updateOnetimeSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  onetimeId: z.string().describe('The one-time product ID'),
  next_charge_scheduled_at: z.string().optional().describe('When to add this to next charge (YYYY-MM-DD format)'),
  quantity: z.number().optional().describe('Quantity'),
  price: z.number().optional().describe('Price per unit'),
  properties: z.array(z.object({
    name: z.string(),
    value: z.string(),
  })).optional().describe('Product properties'),
});

export const onetimeTools = [
  {
    name: 'get_onetimes',
    description: 'Get all one-time products for the current customer',
    inputSchema: onetimeListSchema,
    execute: async (client, args) => {
      const onetimes = await client.getOnetimes();
      return {
        content: [
          {
            type: 'text',
            text: `One-time Products:\n${JSON.stringify(onetimes, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_onetime',
    description: 'Get detailed information about a specific one-time product',
    inputSchema: onetimeSchema,
    execute: async (client, args) => {
      const { onetimeId } = args;
      const onetime = await client.getOnetime(onetimeId);
      return {
        content: [
          {
            type: 'text',
            text: `One-time Product Details:\n${JSON.stringify(onetime, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'create_onetime',
    description: 'Create a new one-time product for the current customer',
    inputSchema: createOnetimeSchema,
    execute: async (client, args) => {
      const onetime = await client.createOnetime(args);
      return {
        content: [
          {
            type: 'text',
            text: `One-time Product Created:\n${JSON.stringify(onetime, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'update_onetime',
    description: 'Update a one-time product',
    inputSchema: updateOnetimeSchema,
    execute: async (client, args) => {
      const { onetimeId, ...updateData } = args;
      const updatedOnetime = await client.updateOnetime(onetimeId, updateData);
      return {
        content: [
          {
            type: 'text',
            text: `Updated One-time Product:\n${JSON.stringify(updatedOnetime, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'delete_onetime',
    description: 'Delete a one-time product',
    inputSchema: onetimeSchema,
    execute: async (client, args) => {
      const { onetimeId } = args;
      const result = await client.deleteOnetime(onetimeId);
      return {
        content: [
          {
            type: 'text',
            text: `Deleted One-time Product:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  },
];