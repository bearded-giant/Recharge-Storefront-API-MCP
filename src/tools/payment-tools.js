import { z } from 'zod';

const baseSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const paymentMethodSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  payment_method_id: z.string().describe('The payment method ID'),
});

const updatePaymentMethodSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  payment_method_id: z.string().describe('The payment method ID'),
  billing_address: z.object({
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    company: z.string().optional(),
    phone: z.string().optional(),
  }).optional().describe('Billing address information'),
});

export const paymentTools = [
  {
    name: 'get_payment_methods',
    description: 'Get payment methods for a specific customer',
    inputSchema: baseSchema,
    execute: async (client, args, context) => {
      let paymentMethods;
      if (context?.customerId || context?.customerEmail) {
        paymentMethods = await client.makeCustomerRequest('GET', '/payment_methods', null, null, context.customerId, context.customerEmail);
      } else {
        paymentMethods = await client.getPaymentMethods();
      }
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
    execute: async (client, args, context) => {
      const { payment_method_id } = args;
      
      let paymentMethod;
      if (context?.customerId || context?.customerEmail) {
        paymentMethod = await client.makeCustomerRequest('GET', `/payment_methods/${payment_method_id}`, null, null, context.customerId, context.customerEmail);
      } else {
        paymentMethod = await client.getPaymentMethod(payment_method_id);
      }
      
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
    description: 'Update payment method billing information',
    inputSchema: updatePaymentMethodSchema,
    execute: async (client, args, context) => {
      const { payment_method_id } = args;
      const paymentData = { ...args };
      delete paymentData.payment_method_id;
      delete paymentData.customer_id;
      delete paymentData.customer_email;
      delete paymentData.session_token;
      delete paymentData.admin_token;
      delete paymentData.store_url;
      
      let updatedPaymentMethod;
      if (context?.customerId || context?.customerEmail) {
        updatedPaymentMethod = await client.makeCustomerRequest('PUT', `/payment_methods/${payment_method_id}`, paymentData, null, context.customerId, context.customerEmail);
      } else {
        updatedPaymentMethod = await client.updatePaymentMethod(payment_method_id, paymentData);
      }
      
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