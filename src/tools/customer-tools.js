import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const customerSchema = z.object({
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
});

const customerByEmailSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  email: z.string().email().describe('Customer email address'),
});

export const customerTools = [
  {
    name: 'get_customer',
    description: 'Retrieve customer information by customer ID',
    inputSchema: customerSchema,
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
];