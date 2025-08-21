import { z } from 'zod';

const baseSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
});

const notificationListSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  limit: z.number().max(250).default(50).describe('Number of notifications to return'),
  page: z.number().default(1).describe('Page number for pagination'),
});

const notificationSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  notification_id: z.string().describe('The notification ID'),
});

const markNotificationReadSchema = z.object({
  session_token: z.string().optional().describe('Recharge session token (optional, takes precedence over environment variable if provided)'),
  merchant_token: z.string().optional().describe('Recharge merchant token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  customer_id: z.string().optional().describe('Customer ID for automatic session creation (optional, used when no session_token provided)'),
  notification_id: z.string().describe('The notification ID'),
});

export const notificationTools = [
  {
    name: 'get_notifications',
    description: 'Get notifications for a specific customer',
    inputSchema: notificationListSchema,
    execute: async (client, args) => {
      const { customer_id, ...params } = args;
      const notifications = await client.getNotifications(customer_id, params);
      return {
        content: [
          {
            type: 'text',
            text: `Customer Notifications:\n${JSON.stringify(notifications, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'get_notification',
    description: 'Get detailed information about a specific notification',
    inputSchema: notificationSchema,
    execute: async (client, args) => {
      const { notification_id } = args;
      const notification = await client.getNotification(notification_id);
      return {
        content: [
          {
            type: 'text',
            text: `Notification Details:\n${JSON.stringify(notification, null, 2)}`,
          },
        ],
      };
    },
  },
  {
    name: 'mark_notification_read',
    description: 'Mark a notification as read',
    inputSchema: markNotificationReadSchema,
    execute: async (client, args) => {
      const { notification_id } = args;
      const result = await client.markNotificationRead(notification_id);
      return {
        content: [
          {
            type: 'text',
            text: `Marked Notification as Read:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  },
];