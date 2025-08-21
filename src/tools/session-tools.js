import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
});

const createSessionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  email: z.string().email().describe('Customer email address'),
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
    inputSchema: baseSchema,
    execute: async (client, args) => {
      const validation = await client.validateSession();
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
    inputSchema: baseSchema,
    execute: async (client, args) => {
      const result = await client.destroySession();
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