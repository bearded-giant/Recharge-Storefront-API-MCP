import { z } from 'zod';

const updateConnectorSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  sync_enabled: z.boolean().optional().describe('Enable sync with Shopify'),
  sync_frequency: z.enum(['hourly', 'daily', 'weekly']).optional().describe('Sync frequency'),
  webhook_url: z.string().url().optional().describe('Webhook URL for notifications'),
});

export const shopifyConnectorTools = [
  {
    name: 'get_shopify_connector',
    description: 'Get Shopify connector configuration and status',
    inputSchema: z.object({
      access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
      store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
    }),
    execute: async (client, args) => {
      const connector = await client.getShopifyConnector();
      return {
        content: [
          {
            type: 'text',
            text: `Shopify Connector:\n${JSON.stringify(connector, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'update_shopify_connector',
    description: 'Update Shopify connector configuration',
    inputSchema: updateConnectorSchema,
    execute: async (client, args) => {
      const updatedConnector = await client.updateShopifyConnector(args);
      return {
        content: [
          {
            type: 'text',
            text: `Updated Shopify Connector:\n${JSON.stringify(updatedConnector, null, 2)}`,
          },
        ],
      };
    },
  },
];