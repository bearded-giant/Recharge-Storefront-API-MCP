import { z } from 'zod';

const baseSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
});

const bundleListSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  subscription_id: z.string().optional().describe('Filter bundles by subscription ID'),
  limit: z.number().max(250).default(50).describe('Number of bundles to return'),
  page: z.number().default(1).describe('Page number for pagination'),
});

const bundleSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  bundle_id: z.string().describe('The bundle ID'),
});

const bundleSelectionSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  bundle_selection_id: z.string().describe('The bundle selection ID'),
});

const createBundleSelectionSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  bundle_id: z.string().describe('The bundle ID'),
  variant_id: z.number().describe('Selected variant ID'),
  quantity: z.number().describe('Quantity selected'),
  external_variant_id: z.string().optional().describe('External variant ID'),
});

const updateBundleSelectionSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  bundle_selection_id: z.string().describe('The bundle selection ID'),
  variant_id: z.number().optional().describe('New variant ID'),
  quantity: z.number().optional().describe('New quantity'),
  external_variant_id: z.string().optional().describe('External variant ID'),
});

const bundleSelectionListSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  bundle_id: z.string().describe('The bundle ID'),
  limit: z.number().max(250).default(50).describe('Number of selections to return'),
});

export const bundleTools = [
  {
    name: 'get_bundles',
    description: 'Get bundles for a specific customer',
    inputSchema: bundleListSchema,
    execute: async (client, args) => {
      const bundles = await client.getBundles(args);
      return {
        content: [
          {
            type: 'text',
            text: `Bundles:\n${JSON.stringify(bundles, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_bundle',
    description: 'Get detailed information about a specific bundle',
    inputSchema: bundleSchema,
    execute: async (client, args) => {
      const { bundle_id } = args;
      const bundle = await client.getBundle(bundle_id);
      return {
        content: [
          {
            type: 'text',
            text: `Bundle Details:\n${JSON.stringify(bundle, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_bundle_selections',
    description: 'Get all selections for a specific bundle',
    inputSchema: bundleSelectionListSchema,
    execute: async (client, args) => {
      const { bundle_id, ...params } = args;
      const selections = await client.getBundleSelections(bundle_id, params);
      return {
        content: [
          {
            type: 'text',
            text: `Bundle Selections:\n${JSON.stringify(selections, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_bundle_selection',
    description: 'Get detailed information about a specific bundle selection',
    inputSchema: bundleSelectionSchema,
    execute: async (client, args) => {
      const { bundle_selection_id } = args;
      const selection = await client.getBundleSelection(bundle_selection_id);
      return {
        content: [
          {
            type: 'text',
            text: `Bundle Selection Details:\n${JSON.stringify(selection, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'create_bundle_selection',
    description: 'Create a new bundle selection',
    inputSchema: createBundleSelectionSchema,
    execute: async (client, args) => {
      const { session_token, merchant_token, store_url, customer_id, ...selectionData } = args;
      const selection = await client.createBundleSelection(selectionData);
      return {
        content: [
          {
            type: 'text',
            text: `Created Bundle Selection:\n${JSON.stringify(selection, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'update_bundle_selection',
    description: 'Update an existing bundle selection',
    inputSchema: updateBundleSelectionSchema,
    execute: async (client, args) => {
      const { bundle_selection_id, session_token, merchant_token, store_url, customer_id, ...updateData } = args;
      const updatedSelection = await client.updateBundleSelection(bundle_selection_id, updateData);
      return {
        content: [
          {
            type: 'text',
            text: `Updated Bundle Selection:\n${JSON.stringify(updatedSelection, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'delete_bundle_selection',
    description: 'Delete a bundle selection',
    inputSchema: bundleSelectionSchema,
    execute: async (client, args) => {
      const { bundle_selection_id } = args;
      const result = await client.deleteBundleSelection(bundle_selection_id);
      return {
        content: [
          {
            type: 'text',
            text: `Deleted Bundle Selection:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  },
];