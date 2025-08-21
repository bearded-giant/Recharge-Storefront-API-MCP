import { z } from 'zod';

const baseSchema = z.object({
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  session_token: z.string().describe('Customer session token'),
});

const updateCustomerSchema = z.object({
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  session_token: z.string().describe('Customer session token'),
  email: z.string().email().optional().describe('Customer email'),
  first_name: z.string().optional().describe('Customer first name'),
  last_name: z.string().optional().describe('Customer last name'),
  phone: z.string().optional().describe('Customer phone number'),
  accepts_marketing: z.boolean().optional().describe('Whether customer accepts marketing'),
});

export const customerTools = [
  {
    name: 'get_customer',
    description: 'Retrieve current customer information',
    inputSchema: baseSchema,
    execute: async (client, args) => {
      const { session_token } = args;
      const customer = await client.getCustomer(session_token);
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
      const { session_token, ...updateData } = args;
      const updatedCustomer = await client.updateCustomer(session_token, updateData);
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
];