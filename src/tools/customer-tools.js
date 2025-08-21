import { z } from 'zod';

const baseSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
});

const createSessionByIdSchema = z.object({
  merchant_token: z.string().optional().describe('Recharge merchant token (required for session creation unless set in environment)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().describe('Customer ID'),
  return_url: z.string().optional().describe('URL to redirect to after session creation'),
});

const customerSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
});

const updateCustomerSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  email: z.string().email().optional().describe('Customer email'),
  first_name: z.string().optional().describe('Customer first name'),
  last_name: z.string().optional().describe('Customer last name'),
  phone: z.string().optional().describe('Customer phone number'),
});

const customerByEmailSchema = z.object({
  merchant_token: z.string().optional().describe('Recharge merchant token (required for customer lookup unless set in environment)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  email: z.string().email().describe('Customer email address'),
});

const createSessionByIdSchema = z.object({
  merchant_token: z.string().optional().describe('Recharge merchant token (required for session creation unless set in environment)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().describe('Customer ID'),
  return_url: z.string().optional().describe('URL to redirect to after session creation'),
});

export const customerTools = [
  {
    name: 'get_customer',
    description: 'Retrieve current customer information',
    inputSchema: customerSchema,
    execute: async (client, args) => {
      const customer = await client.getCustomer();
      return {
        content: [
          {
            type: 'text',
            text: `Customer Information:\n${JSON.stringify(customer, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'update_customer',
    description: 'Update customer information',
    inputSchema: updateCustomerSchema,
    execute: async (client, args) => {
      const { session_token, merchant_token, store_url, ...updateData } = args;
      const updatedCustomer = await client.updateCustomer(updateData);
      return {
        content: [
          {
            type: 'text',
            text: `Updated Customer:\n${JSON.stringify(updatedCustomer, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_customer_by_email',
    description: 'Find customer by email address to get customer ID (requires merchant token)',
    inputSchema: customerByEmailSchema,
    execute: async (client, args) => {
      const { email } = args;
      const customer = await client.getCustomerByEmail(email);
      return {
        content: [
          {
            type: 'text',
            text: `Customer by Email:\n${JSON.stringify(customer, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'create_customer_session_by_id',
    description: 'Create a customer session using customer ID (requires merchant token)',
    inputSchema: createSessionByIdSchema,
    execute: async (client, args) => {
      const { customer_id, return_url } = args;
      const session = await client.createCustomerSessionById(customer_id, { return_url });
      return {
        content: [
          {
            type: 'text',
            text: `Created Customer Session:\n${JSON.stringify(session, null, 2)}`,
          },
        ],
      };
    },
  },
];