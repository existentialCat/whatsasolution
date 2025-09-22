// composables/useSolution.js
import { ref, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSupabaseClient, useSupabaseUser, useAsyncData } from '#imports';
import { useViews } from '~/composables/useViews';
import { useScrollAndHighlight } from '~/composables/useScrollAndHighlight';

export function useSolution() {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const route = useRoute();
  const { recordSolutionViews } = useViews();
  const { trigger: highlightElement } = useScrollAndHighlight();

  let channel = null;

  // This is the key fix: We now use useAsyncData as the primary data fetcher.
  const { data: solution, pending: loading, error } = useAsyncData(
    `solution-${route.params.slug}`, // A unique key for this fetch
    async () => {
      const slug = route.params.slug;
      if (!slug) return null;

      const { data, error: fetchError } = await supabase
        .from('solutions')
        .select(`
          *,
          submitted_by, 
          users (username),
          problems!inner (id, title, slug)
        `)
        .eq('slug', slug)
        .single();

      if (fetchError) throw fetchError;

      let userVote = null;
      if (user.value) {
          const { data: voteData } = await supabase
              .from('solution_votes')
              .select('vote_type')
              .eq('solution_id', data.id)
              .eq('user_id', user.value.id)
              .limit(1);
          if (voteData && voteData.length > 0) userVote = voteData[0].vote_type;
      }
      
      await recordSolutionViews([data.id]);
      
      return { ...data, user_vote: userVote };
    },
    {
      watch: [() => route.params.slug] // Automatically re-fetch when the slug changes
    }
  );

  // Set up the real-time listener when the solution data is available.
  watch(solution, (newSolutionValue, oldSolutionValue) => {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
    if (newSolutionValue) {
      channel = supabase.channel(`solution-update:${newSolutionValue.id}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'solutions',
            filter: `id=eq.${newSolutionValue.id}`
        }, (payload) => {
            // Merge the new data into the existing solution object
            Object.assign(solution.value, payload.new);
        })
        .subscribe();
    }
  }, { immediate: true });
  
  // Highlighting logic
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

