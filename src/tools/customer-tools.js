import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Optional Recharge API access token (takes precedence over environment variable)'),
});

const updateCustomerSchema = z.object({
  access_token: z.string().optional().describe('Optional Recharge API access token (takes precedence over environment variable)'),
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
      const updatedCustomer = await client.updateCustomer(args);
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