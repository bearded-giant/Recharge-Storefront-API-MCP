import { z } from 'zod';

const baseSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
});

const createSessionSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  return_url: z.string().optional().describe('URL to redirect to after session'),
});

const sessionSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  session_id: z.string().describe('The session ID'),
});

export const sessionTools = [
  {
    name: 'create_customer_session',
    description: 'Create a customer session for accessing the customer portal',
    inputSchema: createSessionSchema,
    execute: async (client, args) => {
      const { customer_id, session_token, merchant_token, store_url, ...sessionData } = args;
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