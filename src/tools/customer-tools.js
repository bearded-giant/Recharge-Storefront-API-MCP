import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().describe('Customer ID'),
});

const updateCustomerSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().describe('Customer ID'),
  email: z.string().email().optional().describe('Customer email'),
  first_name: z.string().optional().describe('Customer first name'),
  last_name: z.string().optional().describe('Customer last name'),
  phone: z.string().optional().describe('Customer phone number'),
  accepts_marketing: z.boolean().optional().describe('Whether customer accepts marketing'),
});

const authCustomerSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  email: z.string().email().describe('Customer email address'),
  password: z.string().describe('Customer password'),
});

const customerByEmailSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  email: z.string().email().describe('Customer email address'),
});

const createTokenSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().describe('Customer ID'),
});

export const customerTools = [
  {
    name: 'get_customer',
    description: 'Retrieve customer information by customer ID',
    inputSchema: baseSchema,
    execute: async (client, args) => {
      const { customer_id } = args;
      const customer = await client.getCustomer(customer_id);
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
      const { customer_id, ...updateData } = args;
      const updatedCustomer = await client.updateCustomer(customer_id, updateData);
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
    name: 'authenticate_customer',
    description: 'Authenticate a customer with email and password',
    inputSchema: authCustomerSchema,
    execute: async (client, args) => {
      const { email, password } = args;
      const authResult = await client.authenticateCustomer(email, password);
      return {
        content: [
          {
            type: 'text',
            text: `Customer Authentication:\n${JSON.stringify(authResult, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_customer_by_email',
    description: 'Find customer by email address',
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
    name: 'create_customer_token',
    description: 'Create a session token for a customer',
    inputSchema: createTokenSchema,
    execute: async (client, args) => {
      const { customer_id } = args;
      const tokenResult = await client.createCustomerToken(customer_id);
      return {
        content: [
          {
            type: 'text',
            text: `Customer Session Token:\n${JSON.stringify(tokenResult, null, 2)}`,
          },
        ],
      };
    },
  },
];