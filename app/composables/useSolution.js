// composables/useSolution.js
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useViews } from '~/composables/useViews';
import { useScrollAndHighlight } from '~/composables/useScrollAndHighlight';

export function useSolution() {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const route = useRoute();
  const { recordSolutionViews } = useViews();
  const { trigger: highlightElement } = useScrollAndHighlight();

  const solution = ref(null);
  const loading = ref(true);
  const error = ref(null);
  let channel = null;

  const fetchSolutionDetails = async () => {
    const solutionId = route.params.id;
    try {
      const { data, error: fetchError } = await supabase
        .from('solutions')
        .select(`
          *,
          submitted_by, 
          users (username),
          problems!solutions_parent_problem_fkey (id, title)
        `)
        .eq('id', solutionId)
        .single();

      if (fetchError) throw fetchError;

      let userVote = null;
      if (user.value) {
          const { data: voteData, error: voteError } = await supabase
              .from('solution_votes')
              .select('vote_type')
              .eq('solution_id', solutionId)
              .eq('user_id', user.value.id)
              .limit(1);

          if (voteError) throw voteError;

          if (voteData && voteData.length > 0) {
              userVote = voteData[0].vote_type;
          }
      }

      solution.value = { ...data, user_vote: userVote };
      
      await recordSolutionViews([solutionId]);

    } catch (e) {
      console.error('Error fetching solution details:', e);
      error.value = 'Failed to load the solution.';
    }
  };

  onMounted(async () => {
    loading.value = true;
    await fetchSolutionDetails();
    loading.value = false;

    if (solution.value) {
        channel = supabase.channel(`solution-update:${solution.value.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'solutions',
                filter: `id=eq.${solution.value.id}`
            }, (payload) => {
                Object.assign(solution.value, payload.new);
            })
            .subscribe();
    }
  });

  watch(loading, (isLoading) => {
      if (!isLoading && solution.value) {
          highlightElement();
      }
  });

  watch(() => route.hash, () => {
      highlightElement();
  });

  onUnmounted(() => {
      if (channel) {
          supabase.removeChannel(channel);
      }
  });

  return { solution, loading, error };
}
