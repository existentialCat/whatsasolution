<!-- components/NotificationBell.vue -->
<template>
  <v-menu v-if="user" location="bottom end" transition="slide-y-transition">
      <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" @click="markNotificationsAsRead">
              <v-badge :content="unreadCount" color="error" :model-value="unreadCount > 0">
                  <v-icon>mdi-bell-outline</v-icon>
              </v-badge>
          </v-btn>
      </template>
      <v-list min-width="350" max-height="400">
          <v-list-item v-if="notifications.length === 0">
              <v-list-item-title class="text-grey">You have no new notifications.</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-for="notification in notifications"
            :key="notification.id"
            :to="notification.link"
            :base-color="notification.is_read ? undefined : 'primary'"
          >
              <template v-slot:prepend>
                  <v-icon :icon="notification.icon" size="small"></v-icon>
              </template>
              <v-list-item-title class="text-wrap" v-html="notification.message"></v-list-item-title>
          </v-list-item>
      </v-list>
  </v-menu>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useSupabaseClient, useSupabaseUser, useAsyncData } from '#imports';

const user = useSupabaseUser();
const supabase = useSupabaseClient();

const notifications = ref([]);
const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);

const formatNotification = (n) => {
    const triggerUser = n.triggering_user?.username || 'Someone';
    const strongUser = `<strong>${triggerUser}</strong>`;
    let message = '';
    let link = '/';
    let icon = 'mdi-message-alert';

    switch(n.type) {
        case 'new_solution':
            message = `${strongUser} posted a solution to your problem.`;
            link = `/solutions/${n.source_solution_id}`;
            icon = 'mdi-lightbulb-on';
            break;
        case 'new_comment':
            message = `${strongUser} commented on your solution.`;
            link = `/solutions/${n.source_solution_id}#comment-${n.source_comment_id}`;
            icon = 'mdi-comment-text';
            break;
        case 'new_reply':
            message = `${strongUser} replied to your comment.`;
            link = `/solutions/${n.source_solution_id}#comment-${n.source_comment_id}`;
            icon = 'mdi-reply';
            break;
        case 'comment_like':
            message = `${strongUser} liked your comment.`;
            link = `/solutions/${n.source_solution_id}#comment-${n.source_comment_id}`;
            icon = 'mdi-heart';
            break;
    }
    return { ...n, message, link, icon };
};

// Fetch initial notifications
useAsyncData(
    'user-notifications',
    async () => {
        if(!user.value) return [];
        const { data, error } = await supabase
            .from('notifications')
            .select('*, triggering_user:triggering_user_id(username)')
            .eq('recipient_user_id', user.value.id)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error("Error fetching notifications:", error);
            return [];
        }
        
        // This is the key fix: We now return the formatted data.
        const formatted = data.map(formatNotification);
        notifications.value = formatted;
        return formatted; // <--- ADD THIS LINE
    },
    { watch: [user] }
);

// Real-time notifications subscription
watch(user, (currentUser) => {
    if (!currentUser) {
      notifications.value = []; // Clear notifications on logout
      return;
    }
    
    const channel = supabase.channel(`notifications:${currentUser.id}`);
    
    channel
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_user_id=eq.${currentUser.id}`
        }, async (payload) => {
            const { data, error } = await supabase
                .from('users')
                .select('username')
                .eq('id', payload.new.triggering_user_id)
                .single();
            
            if (!error) {
                const newNotification = { ...payload.new, triggering_user: data };
                notifications.value.unshift(formatNotification(newNotification));
            }
        })
        .subscribe();
    
    // Return a cleanup function to remove the channel when the component unmounts or user changes
    return () => {
        supabase.removeChannel(channel);
    }
}, { immediate: true });


const markNotificationsAsRead = async () => {
    if (unreadCount.value === 0) return;

    const unreadIds = notifications.value.filter(n => !n.is_read).map(n => n.id);

    // Optimistically update UI
    notifications.value.forEach(n => {
      if (!n.is_read) {
        n.is_read = true;
      }
    });

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
    
    if (error) {
      console.error("Error marking notifications as read:", error);
      // NOTE: In a real app, you might want to revert the optimistic UI update here.
    }
};
</script>