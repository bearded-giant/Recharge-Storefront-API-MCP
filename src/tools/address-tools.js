import { z } from 'zod';

const baseSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const addressSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  address_id: z.string().describe('The address ID'),
});

const createAddressSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  address1: z.string().describe('Street address'),
  address2: z.string().optional().describe('Apartment, suite, etc.'),
  city: z.string().describe('City'),
  province: z.string().describe('State/Province'),
  zip: z.string().describe('ZIP/Postal code'),
  country: z.string().describe('Country'),
  first_name: z.string().describe('First name'),
  last_name: z.string().describe('Last name'),
  company: z.string().optional().describe('Company name'),
  phone: z.string().optional().describe('Phone number'),
});

const updateAddressSchema = z.object({
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  customer_email: z.string().email().optional().describe('Customer email for automatic lookup and session creation (optional, used when no session_token or customer_id provided)'),
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  admin_token: z.string().optional().describe('Recharge admin token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  address_id: z.string().describe('The address ID'),
  address1: z.string().optional().describe('Street address'),
  address2: z.string().optional().describe('Apartment, suite, etc.'),
  city: z.string().optional().describe('City'),
  province: z.string().optional().describe('State/Province'),
  zip: z.string().optional().describe('ZIP/Postal code'),
  country: z.string().optional().describe('Country'),
  first_name: z.string().optional().describe('First name'),
  last_name: z.string().optional().describe('Last name'),
  company: z.string().optional().describe('Company name'),
  phone: z.string().optional().describe('Phone number'),
}).refine(data => {
  // At least one field to update must be provided
  const updateFields = ['address1', 'address2', 'city', 'province', 'zip', 'country', 'first_name', 'last_name', 'company', 'phone'];
  return updateFields.some(field => data[field] !== undefined);
}, {
  message: "At least one field to update must be provided"
});

export const addressTools = [
  {
    name: 'get_addresses',
    description: 'Get addresses for a specific customer',
    inputSchema: baseSchema,
    execute: async (client, args) => {
      const addresses = await client.getAddresses({}, args.customer_id, args.customer_email);
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
      const { address_id } = args;
      const address = await client.getAddress(address_id, args.customer_id, args.customer_email);
      
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
    description: 'Create a new address',
    inputSchema: createAddressSchema,
    execute: async (client, args) => {
      const addressData = { ...args };
      delete addressData.customer_id;
      delete addressData.customer_email;
      delete addressData.session_token;
      delete addressData.admin_token;
      delete addressData.store_url;
      const address = await client.createAddress(addressData, args.customer_id, args.customer_email);
      
      return {
        content: [
          {
            type: 'text',
            text: `Created Address:\n${JSON.stringify(address, null, 2)}`,
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
      const { address_id } = args;
      const addressData = { ...args };
      delete addressData.address_id;
      delete addressData.customer_id;
      delete addressData.customer_email;
      delete addressData.session_token;
      delete addressData.admin_token;
      delete addressData.store_url;
      const updatedAddress = await client.updateAddress(address_id, addressData, args.customer_id, args.customer_email);
      
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
    description: 'Delete an address',
    inputSchema: addressSchema,
    execute: async (client, args) => {
      const { address_id } = args;
      const result = await client.deleteAddress(address_id, args.customer_id, args.customer_email);
      
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