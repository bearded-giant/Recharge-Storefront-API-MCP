import { z } from 'zod';

const onetimeListSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
});

const onetimeSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  onetime_id: z.string().describe('The one-time product ID'),
});

const createOnetimeSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
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
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  onetime_id: z.string().describe('The one-time product ID'),
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
    description: 'Get all one-time products for a specific customer',
    inputSchema: onetimeListSchema,
    execute: async (client, args) => {
      const onetimes = await client.getOnetimes(args);
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
      const { onetime_id } = args;
      const onetime = await client.getOnetime(onetime_id);
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
    description: 'Create a new one-time product',
    inputSchema: createOnetimeSchema,
    execute: async (client, args) => {
      const { session_token, merchant_token, store_url, customer_id, ...onetimeData } = args;
      const onetime = await client.createOnetime(onetimeData);
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
      const { onetime_id, session_token, merchant_token, store_url, customer_id, ...updateData } = args;
      const updatedOnetime = await client.updateOnetime(onetime_id, updateData);
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
      const { onetime_id } = args;
      const result = await client.deleteOnetime(onetime_id);
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