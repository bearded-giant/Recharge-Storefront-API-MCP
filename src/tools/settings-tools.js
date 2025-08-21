import { z } from 'zod';

const updateSettingsSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  email_notifications: z.boolean().optional().describe('Enable email notifications'),
  sms_notifications: z.boolean().optional().describe('Enable SMS notifications'),
  language: z.string().optional().describe('Preferred language'),
  timezone: z.string().optional().describe('Timezone preference'),
});

export const settingsTools = [
  {
    name: 'get_settings',
    description: 'Get customer settings and preferences',
    inputSchema: z.object({
      access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
      store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
    }),
    execute: async (client, args) => {
      const settings = await client.getSettings();
      return {
        content: [
          {
            type: 'text',
            text: `Customer Settings:\n${JSON.stringify(settings, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'update_settings',
    description: 'Update customer settings and preferences',
    inputSchema: updateSettingsSchema,
    execute: async (client, args) => {
      const updatedSettings = await client.updateSettings(args);
      return {
        content: [
          {
            type: 'text',
            text: `Updated Settings:\n${JSON.stringify(updatedSettings, null, 2)}`,
          },
        ],
      };
    },
  },
];