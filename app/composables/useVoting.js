// composables/useVoting.js
import { ref } from 'vue';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useRouter } from 'vue-router';

export function useVoting() {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const router = useRouter();
  const votingInProgress = ref(new Set());

  const handleVote = async (solution, voteType) => {
    if (votingInProgress.value.has(solution.id) || !user.value) {
      if (!user.value) router.push('/login');
      return;
    }

    votingInProgress.value.add(solution.id);

    // This optimistic update pattern is known to work from your Problem page
    const originalUserVote = solution.user_vote;
    if (solution.user_vote === 'upvote') solution.upvotes--;
    if (solution.user_vote === 'downvote') solution.downvotes--;
    
    solution.user_vote = originalUserVote === voteType ? null : voteType;
    
    if (solution.user_vote === 'upvote') solution.upvotes++;
    if (solution.user_vote === 'downvote') solution.downvotes++;

    try {
      await supabase.rpc('handle_vote', {
        p_solution_id: solution.id,
        p_user_id: user.value.id,
        p_vote_type: voteType,
      });
    } catch (e) {
      console.error('Error handling vote, a refresh may be needed:', e);
      // A full refresh on error is a simple way to handle rollback
      // Or you could revert the changes manually like before
    } finally {
      votingInProgress.value.delete(solution.id);
    }
  };

  return { votingInProgress, handleVote };
}