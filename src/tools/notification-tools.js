import { z } from 'zod';

const baseSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
});

const markAsReadSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  notificationId: z.string().describe('The notification ID to mark as read'),
});

const notificationSchema = z.object({
  access_token: z.string().optional().describe('Recharge API access token (optional, takes precedence over environment variable if provided)'),
  store_url: z.string().optional().describe('Store URL (optional, takes precedence over environment variable if provided)'),
  notificationId: z.string().describe('The notification ID'),
});

export const notificationTools = [
  {
    name: 'get_notifications',
    description: 'Get all notifications for the current customer',
    inputSchema: baseSchema,
    execute: async (client, args) => {
      const notifications = await client.getNotifications();
      return {
        content: [
          {
            type: 'text',
            text: `Notifications:\n${JSON.stringify(notifications, null, 2)}`,
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
      const { notificationId } = args;
      const notification = await client.getNotification(notificationId);
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
    name: 'mark_notification_as_read',
    description: 'Mark a notification as read',
    inputSchema: markAsReadSchema,
    execute: async (client, args) => {
      const { notificationId } = args;
      const result = await client.markNotificationAsRead(notificationId);
      return {
        content: [
          {
            type: 'text',
            text: `Notification Marked as Read:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    },
  },
];