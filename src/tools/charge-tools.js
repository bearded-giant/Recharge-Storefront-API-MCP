import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const chargeListSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  status: z.enum(['queued', 'processing', 'success', 'error', 'cancelled', 'skipped']).optional().describe('Filter by charge status'),
  limit: z.number().max(250).default(50).describe('Number of charges to return'),
  page: z.number().default(1).describe('Page number for pagination'),
});

const chargeSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  chargeId: z.string().describe('The charge ID'),
});

export const chargeTools = [
  {
    name: 'get_charges',
    description: 'Get all charges for the current customer',
    inputSchema: chargeListSchema,
    execute: async (client, args) => {
      const charges = await client.getCharges(args);
      return {
        content: [
          {
            type: 'text',
            text: `Charges:\n${JSON.stringify(charges, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_charge',
    description: 'Get detailed information about a specific charge',
    inputSchema: chargeSchema,
    execute: async (client, args) => {
      const { chargeId } = args;
      const charge = await client.getCharge(chargeId);
      return {
        content: [
          {
            type: 'text',
            text: `Charge Details:\n${JSON.stringify(charge, null, 2)}`,
          },
        ],
      };
    },
  },
];