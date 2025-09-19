// composables/useNotifications.js
import { computed, watch } from 'vue';
import { useSupabaseClient, useSupabaseUser, useAsyncData, useState } from '#imports';

let isListenerInitialized = false;

const formatNotification = (n) => {
  const triggerUser = n.triggering_user?.username || 'Someone';
  const strongUser = `<strong>${triggerUser}</strong>`;
  let message = '', link = '/', icon = 'mdi-message-alert';

  switch(n.type) {
    case 'new_solution':
      // ✅ UPDATED: Accesses the title via the corrected data path.
      const problemTitle = n.source_solution?.problem_id?.title || 'your problem';
      message = `${strongUser} posted a solution to "${problemTitle}".`;
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


export function useNotifications() {
  const notifications = useState('notifications', () => []);
  const loading = useState('notifications-loading', () => true);

  const user = useSupabaseUser();
  const supabase = useSupabaseClient();

  const { pending, data: fetchedNotifications, refresh } = useAsyncData(
    'user-notifications',
    async () => {
        if (!user.value) return null;
        try {
            const { data, error } = await supabase
                .from('notifications')
                // ✅ UPDATED: Corrected the nested join syntax for problems.
                .select(`
                  *,
                  triggering_user:triggering_user_id(username),
                  source_comment:source_comment_id(content),
                  source_solution:source_solution_id(problem_id:problems(title))
                `)
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
    notifications.value = newData || [];
  }, { immediate: true });

  watch(pending, (newPending) => {
    loading.value = newPending;
  }, { immediate: true });

  if (!isListenerInitialized) {
    isListenerInitialized = true;

    watch(user, (currentUser, previousUser) => {
      if (process.server) return;

      let channel = supabase.channel(`notifications:${previousUser?.id}`);
      if (channel) {
          supabase.removeChannel(channel);
      }
      if (!currentUser) {
          notifications.value = [];
          return;
      }

      channel = supabase.channel(`notifications:${currentUser.id}`);
      channel
        .on(
          'postgres_changes', 
          { 
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_user_id=eq.${currentUser.id}`
          }, 
          async () => {
              await refresh();
          })
        .subscribe();
    }, { immediate: true });
  }

  const unreadCount = computed(() => notifications.value?.filter(n => !n.is_read).length ?? 0);

  const markNotificationsAsRead = async () => {
    if (unreadCount.value === 0 || !user.value) return;
    const unreadIds = notifications.value.filter(n => !n.is_read).map(n => n.id);
    notifications.value.forEach(n => { if(unreadIds.includes(n.id)) n.is_read = true });
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
  };

  const markSingleNotificationAsRead = async (notification) => {
    if (!notification || notification.is_read || !user.value) return;
    
    const notif = notifications.value.find(n => n.id === notification.id);
    if (notif) {
      notif.is_read = true;
    }
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);
  };

  return { 
    notifications, 
    loading, 
    unreadCount, 
    markNotificationsAsRead, 
    markSingleNotificationAsRead 
  };
};