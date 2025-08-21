import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const paymentMethodListSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const updatePaymentMethodSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  paymentMethodId: z.string().describe('The payment method ID'),
  billing_address1: z.string().optional().describe('Billing address line 1'),
  billing_address2: z.string().optional().describe('Billing address line 2'),
  billing_city: z.string().optional().describe('Billing city'),
  billing_province: z.string().optional().describe('Billing province/state'),
  billing_zip: z.string().optional().describe('Billing ZIP/postal code'),
  billing_country: z.string().optional().describe('Billing country'),
});

const paymentMethodSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  paymentMethodId: z.string().describe('The payment method ID'),
});

export const paymentTools = [
  {
    name: 'get_payment_methods',
    description: 'Get all payment methods for the current customer',
    inputSchema: paymentMethodListSchema,
    execute: async (client, args) => {
      const paymentMethods = await client.getPaymentMethods();
      return {
        content: [
          {
            type: 'text',
            text: `Customer Payment Methods:\n${JSON.stringify(paymentMethods, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_payment_method',
    description: 'Get detailed information about a specific payment method',
    inputSchema: paymentMethodSchema,
    execute: async (client, args) => {
      const { paymentMethodId } = args;
      const paymentMethod = await client.getPaymentMethod(paymentMethodId);
      return {
        content: [
          {
            type: 'text',
            text: `Payment Method Details:\n${JSON.stringify(paymentMethod, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'update_payment_method',
    description: 'Update payment method billing address',
    inputSchema: updatePaymentMethodSchema,
    execute: async (client, args) => {
      const { paymentMethodId, ...paymentData } = args;
      const updatedPaymentMethod = await client.updatePaymentMethod(paymentMethodId, paymentData);
      return {
        content: [
          {
            type: 'text',
            text: `Updated Payment Method:\n${JSON.stringify(updatedPaymentMethod, null, 2)}`,
          },
        ],
      };
    },
  },
];