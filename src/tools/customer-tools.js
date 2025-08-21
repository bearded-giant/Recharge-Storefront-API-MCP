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

export const customerTools = [
  {
    name: 'get_customer',
    description: 'Retrieve current customer information',
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
    name: 'find_customer_by_email',
    description: 'Find a customer by email address',
    inputSchema: z.object({
      access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
      store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
      email: z.string().email().describe('Customer email address'),
    }),
    execute: async (client, args) => {
      const { email } = args;
      const customers = await client.findCustomerByEmail(email);
      return {
        content: [
          {
            type: 'text',
            text: `Customer Search Results:\n${JSON.stringify(customers, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_customers',
    description: 'Get all customers with optional filtering',
    inputSchema: z.object({
      access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
      store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
      limit: z.number().max(250).default(50).describe('Number of customers to return'),
      page: z.number().default(1).describe('Page number for pagination'),
      email: z.string().optional().describe('Filter by email'),
    }),
    execute: async (client, args) => {
      const customers = await client.getCustomers(args);
      return {
        content: [
          {
            type: 'text',
            text: `Customers:\n${JSON.stringify(customers, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'create_customer',
    description: 'Create a new customer',
    inputSchema: z.object({
      access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
      store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
      email: z.string().email().describe('Customer email'),
      first_name: z.string().describe('Customer first name'),
      last_name: z.string().describe('Customer last name'),
      phone: z.string().optional().describe('Customer phone number'),
      accepts_marketing: z.boolean().optional().describe('Whether customer accepts marketing'),
    }),
    execute: async (client, args) => {
      const customer = await client.createCustomer(args);
      return {
        content: [
          {
            type: 'text',
            text: `Created Customer:\n${JSON.stringify(customer, null, 2)}`,
          },
        ],
      };
    },
  },
];