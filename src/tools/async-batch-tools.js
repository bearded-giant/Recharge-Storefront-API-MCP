import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const createAsyncBatchSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  batch_type: z.enum(['subscriptions_bulk_update', 'subscriptions_bulk_delete']).describe('Type of batch operation'),
  object_ids: z.array(z.string()).describe('Array of object IDs to process'),
  batch_data: z.object({}).optional().describe('Data for batch operation'),
});

const asyncBatchSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  batch_id: z.string().describe('The async batch ID'),
});

const asyncBatchListSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  limit: z.number().max(250).default(50).describe('Number of batches to return'),
  page: z.number().default(1).describe('Page number for pagination'),
});

export const asyncBatchTools = [
  {
    name: 'create_async_batch',
    description: 'Create an async batch operation for bulk processing',
    inputSchema: createAsyncBatchSchema,
    execute: async (client, args) => {
      const { access_token, store_url, ...batchData } = args;
      const batch = await client.createAsyncBatch(batchData);
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
  {
    name: 'get_async_batches',
    description: 'Get list of async batch operations',
    inputSchema: asyncBatchListSchema,
    execute: async (client, args) => {
      const { access_token, store_url, ...params } = args;
      const batches = await client.getAsyncBatches(params);
      return {
        content: [
          {
            type: 'text',
            text: `Async Batches:\n${JSON.stringify(batches, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_async_batch',
    description: 'Get detailed information about a specific async batch',
    inputSchema: asyncBatchSchema,
    execute: async (client, args) => {
      const { batch_id } = args;
      const batch = await client.getAsyncBatch(batch_id);
      return {
        content: [
          {
            type: 'text',
            text: `Async Batch Details:\n${JSON.stringify(batch, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_async_batch_tasks',
    description: 'Get tasks for a specific async batch',
    inputSchema: asyncBatchSchema,
    execute: async (client, args) => {
      const { batch_id } = args;
      const tasks = await client.getAsyncBatchTasks(batch_id);
      return {
        content: [
          {
            type: 'text',
            text: `Async Batch Tasks:\n${JSON.stringify(tasks, null, 2)}`,
          },
        ],
      };
    },
  },
];