import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const deliveryScheduleSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  delivery_schedule_id: z.string().describe('The delivery schedule ID'),
});

export const storeTools = [
  {
    name: 'get_store_settings',
    description: 'Get store configuration and settings',
    inputSchema: baseSchema,
    execute: async (client, args) => {
      const settings = await client.getStoreSettings();
      return {
        content: [
          {
            type: 'text',
            text: `Store Settings:\n${JSON.stringify(settings, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_delivery_schedules',
    description: 'Get available delivery schedules for the store',
    inputSchema: baseSchema,
    execute: async (client, args) => {
      const schedules = await client.getDeliverySchedules();
      return {
        content: [
          {
            type: 'text',
            text: `Delivery Schedules:\n${JSON.stringify(schedules, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_delivery_schedule',
    description: 'Get detailed information about a specific delivery schedule',
    inputSchema: deliveryScheduleSchema,
    execute: async (client, args) => {
      const { delivery_schedule_id } = args;
      const schedule = await client.getDeliverySchedule(delivery_schedule_id);
      return {
        content: [
          {
            type: 'text',
            text: `Delivery Schedule Details:\n${JSON.stringify(schedule, null, 2)}`,
          },
        ],
      };
    },
  },
];