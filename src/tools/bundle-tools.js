import { z } from 'zod';

const baseSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const bundleListSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  subscription_id: z.string().optional().describe('Filter by subscription ID'),
  limit: z.number().max(250).default(50).describe('Number of bundles to return'),
  page: z.number().default(1).describe('Page number for pagination'),
});

const bundleSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  bundle_id: z.string().describe('The bundle ID'),
});

const bundleSelectionsSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  bundle_id: z.string().describe('The bundle ID'),
  limit: z.number().max(250).default(50).describe('Number of selections to return'),
});

const bundleSelectionSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  bundle_selection_id: z.string().describe('The bundle selection ID'),
});

const createBundleSelectionSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  bundle_id: z.string().describe('The bundle ID'),
  variant_id: z.number().describe('Selected variant ID'),
  quantity: z.number().describe('Quantity selected'),
  external_variant_id: z.number().optional().describe('External variant ID'),
});

const updateBundleSelectionSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  bundle_selection_id: z.string().describe('The bundle selection ID'),
  variant_id: z.number().optional().describe('Selected variant ID'),
  quantity: z.number().optional().describe('Quantity selected'),
  external_variant_id: z.number().optional().describe('External variant ID'),
});

export const bundleTools = [
  {
    name: 'get_bundles',
    description: 'Get bundles for a specific customer',
    inputSchema: bundleListSchema,
    execute: async (client, args, context) => {
      const params = { ...args };
      delete params.customer_id;
      delete params.customer_email;
      delete params.session_token;
      delete params.admin_token;
      delete params.store_url;
      
      let bundles;
      if (context?.customerId || context?.customerEmail) {
        bundles = await client.makeCustomerRequest('GET', '/bundles', null, params, context.customerId, context.customerEmail);
      } else {
        bundles = await client.getBundles(params, null, null);
      }
      
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
    execute: async (client, args, context) => {
      const { bundle_id } = args;
      
      let bundle;
      if (context?.customerId || context?.customerEmail) {
        bundle = await client.makeCustomerRequest('GET', `/bundles/${bundle_id}`, null, null, context.customerId, context.customerEmail);
      } else {
        bundle = await client.getBundle(bundle_id, null, null);
      }
      
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
    description: 'Get bundle selections for a specific bundle',
    inputSchema: bundleSelectionsSchema,
    execute: async (client, args, context) => {
      const { bundle_id } = args;
      const params = { ...args };
      delete params.bundle_id;
      delete params.customer_id;
      delete params.customer_email;
      delete params.session_token;
      delete params.admin_token;
      delete params.store_url;
      
      let selections;
      if (context?.customerId || context?.customerEmail) {
        selections = await client.makeCustomerRequest('GET', `/bundles/${bundle_id}/bundle_selections`, null, params, context.customerId, context.customerEmail);
      } else {
        selections = await client.getBundleSelections(bundle_id, params, null, null);
      }
      
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
    execute: async (client, args, context) => {
      const { bundle_selection_id } = args;
      
      let selection;
      if (context?.customerId || context?.customerEmail) {
        selection = await client.makeCustomerRequest('GET', `/bundle_selections/${bundle_selection_id}`, null, null, context.customerId, context.customerEmail);
      } else {
        selection = await client.getBundleSelection(bundle_selection_id, null, null);
      }
      
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
    description: 'Create a bundle selection',
    inputSchema: createBundleSelectionSchema,
    execute: async (client, args, context) => {
      const selectionData = { ...args };
      delete selectionData.customer_id;
      delete selectionData.customer_email;
      delete selectionData.session_token;
      delete selectionData.admin_token;
      delete selectionData.store_url;
      
      let selection;
      if (context?.customerId || context?.customerEmail) {
        selection = await client.makeCustomerRequest('POST', '/bundle_selections', selectionData, null, context.customerId, context.customerEmail);
      } else {
        selection = await client.createBundleSelection(selectionData, null, null);
      }
      
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
    description: 'Update a bundle selection',
    inputSchema: updateBundleSelectionSchema,
    execute: async (client, args, context) => {
      const { bundle_selection_id } = args;
      const selectionData = { ...args };
      delete selectionData.bundle_selection_id;
      delete selectionData.customer_id;
      delete selectionData.customer_email;
      delete selectionData.session_token;
      delete selectionData.admin_token;
      delete selectionData.store_url;
      
      let updatedSelection;
      if (context?.customerId || context?.customerEmail) {
        updatedSelection = await client.makeCustomerRequest('PUT', `/bundle_selections/${bundle_selection_id}`, selectionData, null, context.customerId, context.customerEmail);
      } else {
        updatedSelection = await client.updateBundleSelection(bundle_selection_id, selectionData, null, null);
      }
      
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
    execute: async (client, args, context) => {
      const { bundle_selection_id } = args;
      
      let result;
      if (context?.customerId || context?.customerEmail) {
        result = await client.makeCustomerRequest('DELETE', `/bundle_selections/${bundle_selection_id}`, null, null, context.customerId, context.customerEmail);
      } else {
        result = await client.deleteBundleSelection(bundle_selection_id, null, null);
      }
      
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