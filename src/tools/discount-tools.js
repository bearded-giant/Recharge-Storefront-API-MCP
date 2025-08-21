import { z } from 'zod';

const baseSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
});

const discountListSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
});

const applyDiscountSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  discount_code: z.string().describe('The discount code to apply'),
});

const removeDiscountSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  discount_id: z.string().describe('The discount ID to remove'),
});

const discountSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  discount_id: z.string().describe('The discount ID'),
});

export const discountTools = [
  {
    name: 'get_discounts',
    description: 'Get all discounts for a specific customer',
    inputSchema: discountListSchema,
    execute: async (client, args) => {
      const discounts = await client.getDiscounts(args);
      return {
        content: [
          {
            type: 'text',
            text: `Discounts:\n${JSON.stringify(discounts, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_discount',
    description: 'Get detailed information about a specific discount',
    inputSchema: discountSchema,
    execute: async (client, args) => {
      const { discount_id, ...otherArgs } = args;
      const discount = await client.getDiscount(discount_id);
      return {
        content: [
          {
            type: 'text',
            text: `Discount Details:\n${JSON.stringify(discount, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'apply_discount',
    description: 'Apply a discount code',
    inputSchema: applyDiscountSchema,
    execute: async (client, args) => {
      const { discount_code, ...otherArgs } = args;
      const appliedDiscount = await client.applyDiscount(discount_code);
      return {
        content: [
          {
            type: 'text',
            text: `Applied Discount:\n${JSON.stringify(appliedDiscount, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'remove_discount',
    description: 'Remove a discount',
    inputSchema: removeDiscountSchema,
    execute: async (client, args) => {
      const { discount_id, ...otherArgs } = args;
      const result = await client.removeDiscount(discount_id);
      return {
        content: [
          {
            type: 'text',
            text: `Removed Discount:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  },
];