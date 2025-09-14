// composables/useComments.js
import { ref, watch, computed } from 'vue';
import { useSupabaseClient, useSupabaseUser, useAsyncData } from '#imports';

// This composable will manage all logic for fetching comments for a given solution.
export function useComments(solutionId) {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const allComments = ref([]);

  const { data: fetchedComments, pending: loading, refresh } = useAsyncData(
    `comments-for-solution-${solutionId}`,
    async () => {
      // This is the key fix: We explicitly select `submitted_by` to ensure it's always available.
      const { data, error } = await supabase
        .from('comments')
        .select('*, submitted_by, users(username), comment_votes(user_id)')
        .eq('parent_solution', solutionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }
      return data;
    },
    {
      default: () => []
    }
  );

  // This watcher syncs the server-fetched data.
  watch(fetchedComments, (newData) => {
    if (newData) {
      allComments.value = newData.map(comment => ({
        ...comment,
        user_liked: false, 
      }));
    }
  }, { immediate: true });

  // This watcher applies user-specific data like "liked" status.
  watch(user, (currentUser) => {
    if (currentUser && allComments.value.length > 0) {
      const userId = currentUser.id;
      allComments.value.forEach(comment => {
        comment.user_liked = comment.comment_votes.some(vote => vote.user_id === userId);
      });
    }
  }, { immediate: true });

  // This computed property builds the nested tree structure for replies.
  const commentTree = computed(() => {
    const comments = allComments.value;
    const map = {};
    const roots = [];

    for (const comment of comments) {
      map[comment.id] = { ...comment, replies: [] };
    }

    for (const comment of comments) {
      if (comment.parent_comment_id && map[comment.parent_comment_id]) {
        map[comment.parent_comment_id].replies.push(map[comment.id]);
      } else {
        roots.push(map[comment.id]);
      }
    }
    return roots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  });

  return { allComments, commentTree, loading, refresh };
}

