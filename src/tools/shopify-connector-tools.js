import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const connectorSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  connector_id: z.string().describe('The connector ID'),
});

const updateConnectorSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  connector_id: z.string().describe('The connector ID'),
  sync_integrations: z.boolean().optional().describe('Enable sync integrations'),
  api_version: z.string().optional().describe('Shopify API version'),
});

export const shopifyConnectorTools = [
  {
    name: 'get_shopify_connectors',
    description: 'Get Shopify connector configurations',
    inputSchema: baseSchema,
    execute: async (client, args) => {
      const connectors = await client.getShopifyConnectors();
      return {
        content: [
          {
            type: 'text',
            text: `Shopify Connectors:\n${JSON.stringify(connectors, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_shopify_connector',
    description: 'Get detailed information about a specific Shopify connector',
    inputSchema: connectorSchema,
    execute: async (client, args) => {
      const { connector_id } = args;
      const connector = await client.getShopifyConnector(connector_id);
      return {
        content: [
          {
            type: 'text',
            text: `Shopify Connector Details:\n${JSON.stringify(connector, null, 2)}`,
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
      const { connector_id, access_token, store_url, ...updateData } = args;
      const updatedConnector = await client.updateShopifyConnector(connector_id, updateData);
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