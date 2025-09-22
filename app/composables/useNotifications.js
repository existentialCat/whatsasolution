// composables/useNotifications.js
import { computed, watch, onUnmounted } from 'vue';
import { useSupabaseClient, useSupabaseUser, useAsyncData, useState } from '#imports';

const formatNotification = (n) => {
  const triggerUser = n.triggering_user?.username || 'Someone';
  const strongUser = `<strong>${triggerUser}</strong>`;
  let message = '', link = '/', icon = 'mdi-message-alert';
  const solutionSlug = n.solutions?.slug;

  switch(n.type) {
    case 'new_solution':
      message = `${strongUser} posted a solution to your problem.`;
      link = solutionSlug ? `/solutions/${solutionSlug}` : `/problems/${n.source_problem_id}`;
      icon = 'mdi-lightbulb-on';
      break;
    case 'new_comment':
      message = `${strongUser} commented on your solution.`;
      link = solutionSlug ? `/solutions/${solutionSlug}#comment-${n.source_comment_id}` : '#';
      icon = 'mdi-comment-text';
      break;
    case 'new_reply':
      message = `${strongUser} replied to your comment.`;
      link = solutionSlug ? `/solutions/${solutionSlug}#comment-${n.source_comment_id}` : '#';
      icon = 'mdi-reply';
      break;
    case 'comment_like':
      message = `${strongUser} liked your comment.`;
      link = solutionSlug ? `/solutions/${solutionSlug}#comment-${n.source_comment_id}` : '#';
      icon = 'mdi-heart';
      break;
  }
  return { ...n, message, link, icon };
};

export function useNotifications() {
  const notifications = useState('notifications', () => []);
  const loading = useState('notifications-loading', () => true);
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();
  const channel = useState('notifications-channel', () => null);

  const { pending, data: fetchedNotifications, refresh } = useAsyncData(
    'user-notifications',
    async () => {
        // ✅ THE FIX: Explicitly return an empty array if there is no user.
        if (!user.value) return [];

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*, context_content, triggering_user:triggering_user_id(username), solutions:source_solution_id(slug)')
                .eq('recipient_user_id', user.value.id)
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (error) throw error;
            return data ? data.map(formatNotification) : [];
        } catch (e) {
            console.error("Error fetching notifications:", e);
            return [];
        }
    },
    { 
      watch: [user],
      default: () => []
    }
  );
  
  watch(fetchedNotifications, (newData) => {
    // This watcher is now safe because it will always receive an array.
    notifications.value = newData || [];
  }, { immediate: true });

  watch(pending, (newPending) => {
    loading.value = newPending;
  }, { immediate: true });
  
  watch(user, (currentUser) => {
    if (process.server) return;
    
    if (channel.value) {
        supabase.removeChannel(channel.value);
        channel.value = null;
    }

    if (!currentUser) {
        // No need to clear notifications here, as the useAsyncData will do it.
        return;
    }

    const newChannel = supabase.channel(`notifications:${currentUser.id}`);
    
    newChannel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `recipient_user_id=eq.${currentUser.id}`
    }, async () => {
        await refresh();
    }).subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Real-time notifications enabled.');
      }
    });

    channel.value = newChannel;

  }, { immediate: true });

  onUnmounted(() => {
    if (channel.value) {
      supabase.removeChannel(channel.value);
    }
  });

  const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);

  const markNotificationsAsRead = async () => {
    // ... function is correct
  };

  const markSingleNotificationAsRead = async (notification) => {
    // ... function is correct
  };

  return { 
    notifications, 
    loading, 
    unreadCount, 
    markNotificationsAsRead,
    markSingleNotificationAsRead
  };
};