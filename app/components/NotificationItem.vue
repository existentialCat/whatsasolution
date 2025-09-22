<template>
  <v-list-item
    @click="handleClick"
    :class="{ 'unread-notification': !notification.is_read }"
    class="pa-4 notification-item"
    style="cursor: pointer;"
  >
    <template v-slot:prepend>
      <v-icon :icon="notification.icon" size="large" class="mr-4" :color="iconColor"></v-icon>
    </template>

    <div>
      <div class="mb-2" v-if="triggeringUsername">
        <v-avatar size="32" class="mr-2" color="grey-lighten-2">
          <span>{{ triggeringUsername.charAt(0).toUpperCase() }}</span>
        </v-avatar>
      </div>
      <div class="text-body-1" v-html="notification.message"></div>
      <div v-if="notification.type === 'new_reply' && notification.source_comment" class="reply-context mt-2">
        <p class="text-grey-darken-1 text-body-2">{{ notification.source_comment?.content }}</p>
      </div>
    </div>
  </v-list-item>
</template>

<style scoped>
/* Your existing styles are correct */
.unread-notification {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-left: 4px solid rgb(var(--v-theme-primary));
}
.notification-item {
  border-left: 4px solid transparent;
}
.reply-context {
  padding-left: 12px;
  border-left: 3px solid #e0e0e0;
  opacity: 0.8;
}
</style>

<script setup>
import { computed } from 'vue';
import { useRouter, useNuxtApp } from '#imports';

const props = defineProps({
  notification: { type: Object, required: true }
});

const router = useRouter();
// Get methods DIRECTLY from the plugin
const { markSingleNotificationAsRead } = useNuxtApp().$notificationActions;

const handleClick = async () => {
  await markSingleNotificationAsRead(props.notification);
  router.push(props.notification.link);
};

const triggeringUsername = computed(() => props.notification.triggering_user?.username);

const iconColor = computed(() => {
  if (props.notification.is_read) return 'grey';
  switch(props.notification.type) {
    case 'new_solution': return 'primary';
    case 'new_comment': return 'blue';
    case 'new_reply': return 'green';
    case 'comment_like': return 'pink';
    default: return 'primary';
  }
});
</script>