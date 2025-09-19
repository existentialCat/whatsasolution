<template>
  <v-list-item
    :to="notification.link"
    :class="{ 'unread-notification': !notification.is_read }"
    class="pa-4 notification-item"
    @click="handleClick"
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
.unread-notification {
  background-color: rgba(var(--v-theme-primary), 0.05);
}
.notification-item {
    border-left: 4px solid transparent;
}
.unread-notification.notification-item {
  border-left-color: rgb(var(--v-theme-primary));
}
.reply-context {
  padding-left: 12px;
  border-left: 3px solid #e0e0e0;
  opacity: 0.8;
}
</style>

<script setup>
import { computed } from 'vue';
import { useNotifications } from '~/composables/useNotifications';

const props = defineProps({
    notification: {
        type: Object,
        required: true
    }
});

// ✅ UPDATED: Import the new, more specific function
const { markSingleNotificationAsRead } = useNotifications();

// ✅ ADDED: A handler to call the function with this component's specific notification
const handleClick = () => {
  markSingleNotificationAsRead(props.notification);
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