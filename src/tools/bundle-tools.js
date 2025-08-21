import { z } from 'zod';

const bundleSelectionListSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const bundleSelectionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  bundleSelectionId: z.string().describe('The bundle selection ID'),
});

const getBundleSelectionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  bundleSelectionId: z.string().describe('The bundle selection ID'),
});

const createBundleSelectionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  bundle_id: z.number().describe('The bundle ID'),
  variant_selections: z.array(z.object({
    variant_id: z.number().describe('Variant ID'),
    quantity: z.number().describe('Quantity'),
  })).describe('Variant selections for the bundle'),
});

const updateBundleSelectionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  bundleSelectionId: z.string().describe('The bundle selection ID'),
  variant_selections: z.array(z.object({
    variant_id: z.number().describe('Variant ID'),
    quantity: z.number().describe('Quantity'),
  })).optional().describe('Updated variant selections'),
});

const deleteBundleSelectionSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  bundleSelectionId: z.string().describe('The bundle selection ID'),
});

export const bundleSelectionTools = [
  {
    name: 'get_bundle_selections',
    description: 'Get all bundle selections for the current customer',
    inputSchema: bundleSelectionListSchema,
    execute: async (client, args) => {
      const bundleSelections = await client.getBundleSelections();
      return {
        content: [
          {
            type: 'text',
            text: `Bundle Selections:\n${JSON.stringify(bundleSelections, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_bundle_selection',
    description: 'Get detailed information about a specific bundle selection',
    inputSchema: getBundleSelectionSchema,
    execute: async (client, args) => {
      const { bundleSelectionId } = args;
      const bundleSelection = await client.getBundleSelection(bundleSelectionId);
      return {
        content: [
          {
            type: 'text',
            text: `Bundle Selection Details:\n${JSON.stringify(bundleSelection, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'create_bundle_selection',
    description: 'Create a bundle selection for the current customer',
    inputSchema: createBundleSelectionSchema,
    execute: async (client, args) => {
      const bundleSelection = await client.createBundleSelection(args);
      return {
        content: [
          {
            type: 'text',
            text: `Bundle Selection Created:\n${JSON.stringify(bundleSelection, null, 2)}`,
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
      const { bundleSelectionId, ...updateData } = args;
      const updatedBundleSelection = await client.updateBundleSelection(bundleSelectionId, updateData);
      return {
        content: [
          {
            type: 'text',
            text: `Updated Bundle Selection:\n${JSON.stringify(updatedBundleSelection, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'delete_bundle_selection',
    description: 'Delete a bundle selection',
    inputSchema: deleteBundleSelectionSchema,
    execute: async (client, args) => {
      const { bundleSelectionId } = args;
      const result = await client.deleteBundleSelection(bundleSelectionId);
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