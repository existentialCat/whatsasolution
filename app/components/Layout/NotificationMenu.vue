<template>
  <v-list-item
    to="/notifications"
    rounded="xl"
    style="cursor: pointer;"
  >
    <template v-slot:prepend>
      <v-badge :content="unreadCount" color="error" :model-value="unreadCount > 0">
        <v-icon>mdi-bell-outline</v-icon>
      </v-badge>
    </template>
    <v-list-item-title>Notifications</v-list-item-title>
  </v-list-item>
</template>

<script setup>
import { useState, computed } from '#imports';

// Get state DIRECTLY from useState
const notifications = useState('notifications', () => []);

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.is_read).length;
});
</script>