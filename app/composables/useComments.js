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

  watch(fetchedComments, (newData) => {
    if (newData) {
      allComments.value = newData.map(comment => ({
        ...comment,
        user_liked: false, 
      }));
    }
  }, { immediate: true });

  watch(user, (currentUser) => {
    if (currentUser && allComments.value.length > 0) {
      const userId = currentUser.id;
      allComments.value.forEach(comment => {
        comment.user_liked = comment.comment_votes.some(vote => vote.user_id === userId);
      });
    }
  }, { immediate: true });

  // This is the key change: We now correctly build and return the flat list.
  const flatComments = computed(() => {
    const comments = allComments.value;
    if (!comments || comments.length === 0) return [];
    
    const commentMap = new Map(comments.map(c => [c.id, { ...c, replies: [] }]));
    const roots = [];

    // Build the tree structure
    for (const comment of commentMap.values()) {
      if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
        const parent = commentMap.get(comment.parent_comment_id);
        // Add context for who is being replied to
        comment.replyingToUsername = parent.users?.username || 'user';
        parent.replies.push(comment);
      } else {
        roots.push(comment);
      }
    }
    
    // Sort top-level comments by most recent
    roots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const flatList = [];
    // Recursive function to flatten the tree into an ordered list
    function flatten(commentList) {
        for (const comment of commentList) {
            flatList.push(comment);
            if (comment.replies && comment.replies.length > 0) {
                // Sort replies by oldest first to maintain conversational flow
                comment.replies.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
                flatten(comment.replies);
            }
        }
    }
    
    flatten(roots);
    return flatList;
  });

  return { allComments, flatComments, loading, refresh };
}

