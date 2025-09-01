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
});

export const addressTools = [
  {
    name: 'get_addresses',
    description: 'Get addresses for a specific customer',
    inputSchema: baseSchema,
    execute: async (client, args, context) => {
      let addresses;
      if (context?.customerId || context?.customerEmail) {
        addresses = await client.makeCustomerRequest('GET', '/addresses', null, null, context.customerId, context.customerEmail);
      } else {
        addresses = await client.getAddresses({});
      }
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
    execute: async (client, args, context) => {
      const { address_id } = args;
      
      let address;
      if (context?.customerId || context?.customerEmail) {
        address = await client.makeCustomerRequest('GET', `/addresses/${address_id}`, null, null, context.customerId, context.customerEmail);
      } else {
        address = await client.getAddress(address_id, null, null);
      }
      
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
    execute: async (client, args, context) => {
      const addressData = { ...args };
      delete addressData.customer_id;
      delete addressData.customer_email;
      delete addressData.session_token;
      delete addressData.admin_token;
      delete addressData.store_url;
      
      let address;
      if (context?.customerId || context?.customerEmail) {
        address = await client.makeCustomerRequest('POST', '/addresses', addressData, null, context.customerId, context.customerEmail);
      } else {
        address = await client.createAddress(addressData, null, null);
      }
      
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
    execute: async (client, args, context) => {
      const { address_id } = args;
      const addressData = { ...args };
      delete addressData.address_id;
      delete addressData.customer_id;
      delete addressData.customer_email;
      delete addressData.session_token;
      delete addressData.admin_token;
      delete addressData.store_url;
      
      let updatedAddress;
      if (context?.customerId || context?.customerEmail) {
        updatedAddress = await client.makeCustomerRequest('PUT', `/addresses/${address_id}`, addressData, null, context.customerId, context.customerEmail);
      } else {
        updatedAddress = await client.updateAddress(address_id, addressData, null, null);
      }
      
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
    execute: async (client, args, context) => {
      const { address_id } = args;
      
      let result;
      if (context?.customerId || context?.customerEmail) {
        result = await client.makeCustomerRequest('DELETE', `/addresses/${address_id}`, null, null, context.customerId, context.customerEmail);
      } else {
        result = await client.deleteAddress(address_id, null, null);
      }
      
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