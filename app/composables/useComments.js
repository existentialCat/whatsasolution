import { ref, watchEffect } from 'vue';
import { useSupabaseClient, useSupabaseUser, useAsyncData, useRouter } from '#imports';

export function useComments(solutionId) {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const router = useRouter();
  
  const processedComments = ref([]);

  const { data: allComments, pending: loading, refresh } = useAsyncData(
    `comments-for-solution-${solutionId}`,
    async () => {
      if (!solutionId) return [];
      const { data, error } = await supabase
        .from('comments')
        .select('*, users(username, slug), comment_votes(*)')
        .eq('parent_solution', solutionId)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }
      return data;
    },
    { 
      default: () => [],
      watch: [user] 
    }
  );

  watchEffect(() => {
    const comments = allComments.value || [];
    if (comments.length === 0) {
      processedComments.value = [];
      return;
    }
    
    const commentMap = new Map(comments.map(c => [c.id, { 
      ...c, 
      user_liked: c.comment_votes.some(vote => vote.user_id === user.value?.id),
      likes: c.comment_votes.length,
      replies: [] 
    }]));
    
    const roots = [];
    for (const comment of commentMap.values()) {
      if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
        const parent = commentMap.get(comment.parent_comment_id);
        comment.replyingToUsername = parent.users?.username;
        comment.replyingToUser = parent.users;
        parent.replies.push(comment);
      } else {
        roots.push(comment);
      }
    }
    
    roots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const flatList = [];
    function flatten(commentList) {
      for (const comment of commentList) {
        flatList.push(comment);
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
          flatten(comment.replies);
        }
      }
    }
    flatten(roots);
    processedComments.value = flatList;
  });

  const addComment = async ({ content, parentCommentId = null }) => {
    if (!user.value || !content.trim()) return;
    await supabase.from('comments').insert({
      content, parent_solution: solutionId, parent_comment_id: parentCommentId, submitted_by: user.value.id
    });
    await refresh();
  };

  const deleteComment = async (commentId) => {
    const index = processedComments.value.findIndex(c => c.id === commentId);
    if (index > -1) {
      processedComments.value.splice(index, 1);
    }
    await supabase.from('comments').delete().eq('id', commentId);
  };

  const updateComment = async ({ id, content }) => {
    const comment = processedComments.value.find(c => c.id === id);
    if (comment) {
      comment.content = content;
    }
    await supabase.from('comments').update({ content }).eq('id', id);
  };

  const likeComment = async (commentId) => {
    if (!user.value) return router.push('/login');

    const comment = processedComments.value.find(c => c.id === commentId);
    if (!comment) return;

    // Store original state for potential rollback
    const originalLikedState = comment.user_liked;
    const originalLikesCount = comment.likes;

    // Immediately update the UI for an instant response
    comment.user_liked = !comment.user_liked;
    comment.likes += comment.user_liked ? 1 : -1;
    
    try {
      // Send the update to the database in the background
      const { error } = await supabase.rpc('toggle_comment_like', { 
        p_comment_id: commentId, 
        p_user_id: user.value.id 
      });
      if (error) throw error; // If this fails, the catch block will run

    } catch (error) {
      console.error("Failed to update like status, reverting:", error);
      // If the database fails, revert the optimistic UI change
      comment.user_liked = originalLikedState;
      comment.likes = originalLikesCount;
    }
  };

  return { 
    flatComments: processedComments, 
    loading, 
    addComment,
    deleteComment,
    updateComment,
    likeComment
  };
}