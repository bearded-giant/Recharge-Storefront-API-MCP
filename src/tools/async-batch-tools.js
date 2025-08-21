import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (overrides environment variable)'),
});

const batchSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (overrides environment variable)'),
  batchId: z.string().describe('The async batch ID'),
});

const createBatchSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (overrides environment variable)'),
  operations: z.array(z.object({
    method: z.enum(['POST', 'PUT', 'DELETE']).describe('HTTP method'),
    path: z.string().describe('API endpoint path'),
    body: z.record(z.any()).optional().describe('Request body'),
  })).describe('Batch operations to execute'),
});

export const asyncBatchTools = [
  {
    name: 'get_async_batch',
    description: 'Get the status and results of an async batch operation',
    inputSchema: batchSchema,
    execute: async (client, args) => {
      const { batchId } = args;
      const batch = await client.getAsyncBatch(batchId);
      return {
        content: [
          {
            type: 'text',
            text: `Async Batch:\n${JSON.stringify(batch, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'create_async_batch',
    description: 'Create a new async batch operation for bulk updates',
    inputSchema: createBatchSchema,
    execute: async (client, args) => {
      const batch = await client.createAsyncBatch(args);
      return {
        content: [
          {
            type: 'text',
            text: `Created Async Batch:\n${JSON.stringify(batch, null, 2)}`,
          },
        ],
      };
    },
  },
];