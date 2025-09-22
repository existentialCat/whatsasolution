import { computed, watch } from 'vue';
import { useSupabaseClient, useSupabaseUser, useState, defineNuxtPlugin } from '#imports';

const formatNotification = (n) => {
  if (!n || typeof n !== 'object') return null;
  const triggerUser = n.triggering_user?.username || 'Someone';
  const strongUser = `<strong>${triggerUser}</strong>`;
  let message = '', link = '/', icon = 'mdi-message-alert';
  const solutionSlug = n.solutions?.slug;
  switch(n.type) {
    case 'new_solution':
      message = `${strongUser} posted a solution to your problem.`;
      link = solutionSlug ? `/solutions/${solutionSlug}` : '#';
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

export default defineNuxtPlugin(async (nuxtApp) => {
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();

  const notifications = useState('notifications', () => []);
  const loading = useState('notifications-loading', () => true);
  
  // ✅ On the server, only fetch initial data to prevent crashes
  if (process.server) {
    if (user.value) {
      const { data } = await supabase
        .from('notifications')
        .select('*, context_content, triggering_user:triggering_user_id(username), solutions:source_solution_id(slug)')
        .eq('recipient_user_id', user.value.id)
        .order('created_at', { ascending: false })
        .limit(20);
      notifications.value = (data || []).map(formatNotification).filter(Boolean);
    }
    loading.value = false;
  }

  // ✅ On the client, set up the full watcher and real-time listener
  if (process.client) {
    const channel = useState('notifications-channel', () => null);

    watch(user, async (currentUser) => {
      // If user logs in on the client, fetch their notifications
      if (currentUser && notifications.value.length === 0) {
        loading.value = true;
        const { data } = await supabase
          .from('notifications')
          .select('*, context_content, triggering_user:triggering_user_id(username), solutions:source_solution_id(slug)')
          .eq('recipient_user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(20);
        notifications.value = (data || []).map(formatNotification).filter(Boolean);
        loading.value = false;
      }

      // Manage the real-time channel
      if (channel.value) supabase.removeChannel(channel.value);
      
      if (currentUser) {
        const newChannel = supabase.channel(`notifications:${currentUser.id}`);
        newChannel
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_user_id=eq.${currentUser.id}` }, 
          async (payload) => {
            const { data: newNotificationDetails } = await supabase
              .from('notifications')
              .select('*, context_content, triggering_user:triggering_user_id(username), solutions:source_solution_id(slug)')
              .eq('id', payload.new.id)
              .single();
            if (newNotificationDetails) {
              notifications.value.unshift(formatNotification(newNotificationDetails));
            }
          })
          .subscribe();
        channel.value = newChannel;
      } else {
        notifications.value = [];
      }
    }, { immediate: true });
  }

  const markSingleNotificationAsRead = async (notification) => {
    if (!notification || notification.is_read) return;
    const local = notifications.value.find(n => n.id === notification.id);
    if (local) local.is_read = true;
    await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
  };
  
  const markNotificationsAsRead = async () => {
    const unreadIds = notifications.value.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      notifications.value.forEach(n => { if (unreadIds.includes(n.id)) n.is_read = true; });
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    }
  };
  
  // Provide ONLY the action methods to the app
  return {
    provide: {
      notificationActions: {
        markNotificationsAsRead,
        markSingleNotificationAsRead,
      }
    }
  }
});