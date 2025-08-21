import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const createSessionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().describe('Customer ID'),
  return_url: z.string().optional().describe('URL to redirect to after session'),
});

const sessionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  session_id: z.string().describe('The session ID'),
});

export const sessionTools = [
  {
    name: 'create_customer_session',
    description: 'Create a customer session for accessing the customer portal',
    inputSchema: createSessionSchema,
    execute: async (client, args) => {
      const { customer_id, access_token, store_url, ...sessionData } = args;
      const session = await client.createCustomerSession(customer_id, sessionData);
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
  {
    name: 'get_session',
    description: 'Get session information',
    inputSchema: sessionSchema,
    execute: async (client, args) => {
      const { session_id } = args;
      const session = await client.getSession(session_id);
      return {
        content: [
          {
            type: 'text',
            text: `Session Details:\n${JSON.stringify(session, null, 2)}`,
          },
        ],
      };
    },
  },
];