import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const addressListSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID (optional filter)'),
});

const createAddressSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().describe('Customer ID'),
  address1: z.string().describe('Street address line 1'),
  address2: z.string().optional().describe('Street address line 2'),
  city: z.string().describe('City'),
  province: z.string().describe('State/Province'),
  zip: z.string().describe('Postal/ZIP code'),
  country: z.string().describe('Country'),
  first_name: z.string().describe('First name'),
  last_name: z.string().describe('Last name'),
  company: z.string().optional().describe('Company name'),
  phone: z.string().optional().describe('Phone number'),
});

const updateAddressSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  address_id: z.string().describe('The address ID'),
  address1: z.string().optional().describe('Street address line 1'),
  address2: z.string().optional().describe('Street address line 2'),
  city: z.string().optional().describe('City'),
  province: z.string().optional().describe('State/Province'),
  zip: z.string().optional().describe('Postal/ZIP code'),
  country: z.string().optional().describe('Country'),
  first_name: z.string().optional().describe('First name'),
  last_name: z.string().optional().describe('Last name'),
  company: z.string().optional().describe('Company name'),
  phone: z.string().optional().describe('Phone number'),
});

const deleteAddressSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  address_id: z.string().describe('The address ID'),
});

const addressSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  address_id: z.string().describe('The address ID'),
});

export const addressTools = [
  {
    name: 'get_addresses',
    description: 'Get all addresses for a specific customer',
    inputSchema: addressListSchema,
    execute: async (client, args) => {
      const addresses = await client.getAddresses(args);
      return {
        content: [
          {
            type: 'text',
            text: `Addresses:\n${JSON.stringify(addresses, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_address',
    description: 'Get detailed information about a specific address',
    inputSchema: addressSchema,
    execute: async (client, args) => {
      const { address_id, ...otherArgs } = args;
      const address = await client.getAddress(address_id);
      return {
        content: [
          {
            type: 'text',
            text: `Address Details:\n${JSON.stringify(address, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'create_address',
    description: 'Create a new address for a customer',
    inputSchema: createAddressSchema,
    execute: async (client, args) => {
      const { access_token, store_url, ...addressData } = args;
      const newAddress = await client.createAddress(addressData);
      return {
        content: [
          {
            type: 'text',
            text: `Created Address:\n${JSON.stringify(newAddress, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'update_address',
    description: 'Update an existing address',
    inputSchema: updateAddressSchema,
    execute: async (client, args) => {
      const { address_id, access_token, store_url, ...addressData } = args;
      const updatedAddress = await client.updateAddress(address_id, addressData);
      return {
        content: [
          {
            type: 'text',
            text: `Updated Address:\n${JSON.stringify(updatedAddress, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'delete_address',
    description: 'Delete an existing address',
    inputSchema: deleteAddressSchema,
    execute: async (client, args) => {
      const { address_id, ...otherArgs } = args;
      const result = await client.deleteAddress(address_id);
      return {
        content: [
          {
            type: 'text',
            text: `Deleted Address:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  },
];