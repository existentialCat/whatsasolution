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
    if (votingInProgress.value.has(solution.id)) return;
    if (!user.value) {
      router.push('/login');
      return;
    }

    votingInProgress.value.add(solution.id);

    // Store original state for potential UI revert on error
    const originalUpvotes = solution.upvotes;
    const originalDownvotes = solution.downvotes;
    const originalUserVote = solution.user_vote;

    // Optimistic UI update
    let newUserVote = solution.user_vote === voteType ? null : voteType;
    if (originalUserVote === 'upvote') solution.upvotes--;
    if (originalUserVote === 'downvote') solution.downvotes--;
    if (newUserVote === 'upvote') solution.upvotes++;
    if (newUserVote === 'downvote') solution.downvotes++;
    solution.user_vote = newUserVote;

    try {
      const { error: rpcError } = await supabase.rpc('handle_vote', {
        p_solution_id: solution.id,
        p_user_id: user.value.id,
        p_vote_type: voteType,
      });
      if (rpcError) throw rpcError;
    } catch (e) {
      console.error('Error handling vote, reverting UI:', e);
      solution.upvotes = originalUpvotes;
      solution.downvotes = originalDownvotes;
      solution.user_vote = originalUserVote;
    } finally {
      votingInProgress.value.delete(solution.id);
    }
  };

  return { votingInProgress, handleVote };
}
