import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (overrides environment variable)'),
});

export const storeTools = [
  {
    name: 'get_store',
    description: 'Get store information and configuration',
    inputSchema: baseSchema,
    execute: async (client, args) => {
      const store = await client.getStore();
      return {
        content: [
          {
            type: 'text',
            text: `Store Information:\n${JSON.stringify(store, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_delivery_schedule',
    description: 'Get delivery schedule information',
    inputSchema: baseSchema,
    execute: async (client, args) => {
      const schedule = await client.getDeliverySchedule();
      return {
        content: [
          {
            type: 'text',
            text: `Delivery Schedule:\n${JSON.stringify(schedule, null, 2)}`,
          },
        ],
      };
    },
  },
];