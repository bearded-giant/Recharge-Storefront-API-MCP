import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (overrides environment variable)'),
});

const discountListSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (overrides environment variable)'),
});

const applyDiscountSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (overrides environment variable)'),
  discount_code: z.string().describe('The discount code to apply'),
});

const removeDiscountSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (overrides environment variable)'),
  discountId: z.string().describe('The discount ID to remove'),
});

const discountSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (overrides environment variable)'),
  discountId: z.string().describe('The discount ID'),
});

export const discountTools = [
  {
    name: 'get_discounts',
    description: 'Get all discounts for the current customer',
    inputSchema: discountListSchema,
    execute: async (client, args) => {
      const discounts = await client.getDiscounts();
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
      const { discountId } = args;
      const discount = await client.getDiscount(discountId);
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
    description: 'Apply a discount code to the current customer',
    inputSchema: applyDiscountSchema,
    execute: async (client, args) => {
      const { discount_code } = args;
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
    description: 'Remove a discount from the current customer',
    inputSchema: removeDiscountSchema,
    execute: async (client, args) => {
      const { discountId } = args;
      const result = await client.removeDiscount(discountId);
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