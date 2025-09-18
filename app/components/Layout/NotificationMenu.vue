<!-- /components/Layout/NotificationMenu.vue -->
<template>
  <v-list-item rounded="xl">
    <v-menu activator="parent" location="end" transition="slide-x-transition">
      <v-list min-width="350" max-height="400">
        <v-list-item v-if="notifications.length === 0">
          <v-list-item-title class="text-grey">You have no new notifications.</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-for="notification in notifications"
          :key="notification.id"
          :to="notification.link"
          :base-color="notification.is_read ? undefined : 'primary'"
          @click="markNotificationsAsRead"
        >
          <template v-slot:prepend>
            <v-icon :icon="notification.icon" size="small"></v-icon>
          </template>
          <v-list-item-title class="text-wrap" v-html="notification.message"></v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <template v-slot:prepend>
      <v-badge :content="unreadCount" color="error" :model-value="unreadCount > 0" dot>
        <v-icon>mdi-bell-outline</v-icon>
      </v-badge>
    </template>
    <v-list-item-title>Notifications</v-list-item-title>
  </v-list-item>
</template>

<script setup>
import { useNotifications } from '~/composables/useNotifications';
const { notifications, unreadCount, markNotificationsAsRead } = useNotifications();
</script>