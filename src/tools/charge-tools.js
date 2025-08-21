import { z } from 'zod';

const baseSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
});

const chargeListSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  status: z.enum(['queued', 'processing', 'success', 'error', 'cancelled', 'skipped']).optional().describe('Filter by charge status'),
  limit: z.number().max(250).default(50).describe('Number of charges to return'),
  page: z.number().default(1).describe('Page number for pagination'),
});

const chargeSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  charge_id: z.string().describe('The charge ID'),
});

export const chargeTools = [
  {
    name: 'get_charges',
    description: 'Get all charges for a specific customer',
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
      const { charge_id, ...otherArgs } = args;
      const charge = await client.getCharge(charge_id);
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