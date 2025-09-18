// composables/useNotifications.js
import { ref, computed, watch } from 'vue';
import { useSupabaseClient, useSupabaseUser, useAsyncData } from '#imports';

// Helper function to format notification messages
const formatNotification = (n) => {
  const triggerUser = n.triggering_user?.username || 'Someone';
  const strongUser = `<strong>${triggerUser}</strong>`;
  let message = '', link = '/', icon = 'mdi-message-alert';

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


export function useNotifications() {
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();
  const notifications = ref([]);

  // Fetch initial notifications
  useAsyncData(
    'user-notifications',
    async () => {
        if(!user.value) {
            notifications.value = [];
            return []; // Always return a value
        }
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*, triggering_user:triggering_user_id(username)')
                .eq('recipient_user_id', user.value.id)
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (error) throw error;

            const formatted = data ? data.map(formatNotification) : [];
            notifications.value = formatted;
            return formatted; // Return the fetched and formatted data
        } catch (e) {
            console.error("Error fetching notifications:", e);
            notifications.value = [];
            return []; // Always return a value, even on error
        }
    },
    { watch: [user] }
  );
  
  // Real-time subscription
  watch(user, (currentUser, previousUser) => {
    if (previousUser) {
        supabase.removeChannel(supabase.channel(`notifications:${previousUser.id}`));
    }
    if (!currentUser) return;

    const channel = supabase.channel(`notifications:${currentUser.id}`);
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_user_id=eq.${currentUser.id}`
      }, async (payload) => {
        const { data: userData, error } = await supabase
          .from('users').select('username').eq('id', payload.new.triggering_user_id).single();
        
        if (!error) {
          const newNotification = { ...payload.new, triggering_user: userData };
          notifications.value.unshift(formatNotification(newNotification));
        }
      })
      .subscribe();
  }, { immediate: true });

  const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);

  const markNotificationsAsRead = async () => {
    if (unreadCount.value === 0 || !user.value) return;
    notifications.value.forEach(n => n.is_read = true); // Optimistic update
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_user_id', user.value.id)
      .eq('is_read', false);
  };

  return { notifications, unreadCount, markNotificationsAsRead };
};

