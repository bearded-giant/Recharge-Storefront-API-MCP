import { z } from 'zod';

const baseSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
});

const paymentMethodListSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
});

const updatePaymentMethodSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  payment_method_id: z.string().describe('The payment method ID'),
  billing_address1: z.string().optional().describe('Billing address line 1'),
  billing_address2: z.string().optional().describe('Billing address line 2'),
  billing_city: z.string().optional().describe('Billing city'),
  billing_province: z.string().optional().describe('Billing province/state'),
  billing_zip: z.string().optional().describe('Billing ZIP/postal code'),
  billing_country: z.string().optional().describe('Billing country'),
});

const paymentMethodSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  payment_method_id: z.string().describe('The payment method ID'),
});

export const paymentTools = [
  {
    name: 'get_payment_methods',
    description: 'Get all payment methods for a specific customer',
    inputSchema: paymentMethodListSchema,
    execute: async (client, args) => {
      const paymentMethods = await client.getPaymentMethods(args);
      return {
        content: [
          {
            type: 'text',
            text: `Payment Methods:\n${JSON.stringify(paymentMethods, null, 2)}`,
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
      const { payment_method_id, ...otherArgs } = args;
      const paymentMethod = await client.getPaymentMethod(payment_method_id);
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
      const { payment_method_id, session_token, merchant_token, store_url, customer_id, ...paymentData } = args;
      const updatedPaymentMethod = await client.updatePaymentMethod(payment_method_id, paymentData);
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