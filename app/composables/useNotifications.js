import { computed, watch } from 'vue';
import { useSupabaseClient, useSupabaseUser, useAsyncData, useState, onUnmounted } from '#imports';

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
  let channel = null;

  const { pending, data: fetchedNotifications, refresh } = useAsyncData(
    'user-notifications',
    async () => {
        if (!user.value) return; 

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
    if (Array.isArray(newData)) {
        notifications.value = newData;
    }
  }, { immediate: true });

  watch(pending, (newPending) => {
    loading.value = newPending;
  }, { immediate: true });
  
  watch(user, (currentUser, oldUser) => {
    if (process.server) return;
    
    if (channel) {
        supabase.removeChannel(channel);
        channel = null;
    }

    if (oldUser && !currentUser) {
        notifications.value = [];
    }
    
    if (!currentUser) {
        return;
    }

    channel = supabase.channel(`notifications:${currentUser.id}`);
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_user_id=eq.${currentUser.id}`
      }, async () => {
          await refresh();
      })
      .subscribe();
  }, { immediate: true });

  onUnmounted(() => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  });

  const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);

  const markNotificationsAsRead = async () => {
    const unreadIds = notifications.value.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0 || !user.value) return;
    
    notifications.value.forEach(n => { 
        if(unreadIds.includes(n.id)) n.is_read = true 
    });

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
  };

  // ✅ ADDED THIS NEW FUNCTION
  const markSingleNotificationAsRead = async (notification) => {
    if (!user.value || !notification || notification.is_read) return;

    // Optimistically update the UI for an instant response
    const localNotification = notifications.value.find(n => n.id === notification.id);
    if (localNotification) {
      localNotification.is_read = true;
    }

    // Update the database in the background
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Optional: Revert the UI change if the database update fails
      if (localNotification) {
        localNotification.is_read = false;
      }
    }
  };

  return { 
    notifications, 
    loading, 
    unreadCount, 
    markNotificationsAsRead,
    markSingleNotificationAsRead // ✨ EXPORT THE NEW FUNCTION
  };
};