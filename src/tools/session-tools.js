import { z } from 'zod';

const baseSchema = z.object({
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const createSessionSchema = z.object({
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  email: z.string().email().describe('Customer email address'),
});

const sessionTokenSchema = z.object({
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  session_token: z.string().describe('Customer session token'),
});

export const sessionTools = [
  {
    name: 'create_session',
    description: 'Create a customer session with email',
    inputSchema: createSessionSchema,
    execute: async (client, args) => {
      const { email } = args;
      const session = await client.createSession(email);
      return {
        content: [
          {
            type: 'text',
            text: `Session Created:\n${JSON.stringify(session, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'validate_session',
    description: 'Validate the current session',
    inputSchema: sessionTokenSchema,
    execute: async (client, args) => {
      const { session_token } = args;
      const validation = await client.validateSession(session_token);
      return {
        content: [
          {
            type: 'text',
            text: `Session Validation:\n${JSON.stringify(validation, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'destroy_session',
    description: 'Destroy the current session (logout)',
    inputSchema: sessionTokenSchema,
    execute: async (client, args) => {
      const { session_token } = args;
      const result = await client.destroySession(session_token);
      return {
        content: [
          {
            type: 'text',
            text: `Session Destroyed:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  },
];