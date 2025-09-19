<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">Notifications</h1>
      <v-btn v-if="unreadCount > 0" @click="markNotificationsAsRead" color="primary" variant="tonal" size="small">
        Mark all as read
      </v-btn>
    </div>

    <ClientOnly>
      <div v-if="loading" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4">Loading notifications...</p>
      </div>

      <v-row v-else-if="notifications && notifications.length > 0" justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card flat class="border rounded-lg">
            <v-list lines="three" class="py-0">
              <template v-for="(notification, index) in notifications" :key="notification.id">
                <NotificationItem :notification="notification" />
                <v-divider v-if="index < notifications.length - 1"></v-divider>
              </template>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
      
      <div v-else class="text-center text-grey py-16">
        <v-icon size="x-large" class="mb-4">mdi-bell-off-outline</v-icon>
        <h2 class="text-h6">You have no notifications</h2>
        <p>New solutions, comments, and replies will appear here.</p>
      </div>

      <template #fallback>
        <div class="text-center py-10">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4">Loading notifications...</p>
        </div>
      </template>
    </ClientOnly>
  </v-container>
</template>

<style scoped>
/* Scoped styles are no longer needed here as they are handled by the component */
</style>

<script setup>
import { useNotifications } from '~/composables/useNotifications';
import NotificationItem from '~/components/NotificationItem.vue'; // Import the new component

const { notifications, loading, unreadCount, markNotificationsAsRead } = useNotifications();
</script>