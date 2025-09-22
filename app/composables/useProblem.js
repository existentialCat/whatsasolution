// composables/useProblem.js
import { ref, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useViews } from '~/composables/useViews';
import { usePermissions } from '~/composables/usePermissions';

export function useProblem() {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const route = useRoute();
  const router = useRouter();
  const { recordSolutionViews } = useViews();
  const { isOwner } = usePermissions();

  const problem = ref(null);
  const profile = ref(null);
  const loading = ref(true);
  const error = ref(null);
  let problemChannel = null;
  let solutionsChannel = null;
  
  const fetchProblemDetails = async (slug) => {
    if (!slug) {
      problem.value = null;
      loading.value = false;
      return;
    }

    loading.value = true;
    error.value = null;
    try {
        const { data, error: rpcError } = await supabase.rpc('get_problem_details', {
            p_problem_slug: slug,
            p_user_id: user.value?.id,
        });
        if (rpcError) throw rpcError;
        problem.value = data && data.length > 0 ? data[0] : null;

        if (problem.value && problem.value.solutions) {
            const solutionIds = problem.value.solutions.map(s => s.id);
            await recordSolutionViews(solutionIds);
        }
    } catch (e) {
        console.error("Error fetching problem details:", e);
        error.value = "Failed to load page data.";
        problem.value = null;
    } finally {
        loading.value = false;
    }
  };

  const fetchUserProfile = async () => {
    if (!user.value) {
        profile.value = null;
        return;
    };
    try {
        const { data: profileData, error: profileError } = await supabase
            .from('users').select('role, username').eq('id', user.value.id).single();
        if (profileError) throw profileError;
        profile.value = profileData;
    } catch (e) {
        console.error("Error fetching user profile:", e);
    }
  };

  const handleSolutionDeleted = (deletedSolutionId) => {
    if (problem.value && problem.value.solutions) {
        problem.value.solutions = problem.value.solutions.filter(s => s.id !== deletedSolutionId);
    }
  };
  
  const deleteProblem = async () => {
    if (!problem.value) return;
    try {
      const { error: functionError } = await supabase.functions.invoke('delete-problem', {
        body: { problem_id: problem.value.id }
      });
      if (functionError) throw functionError;
      router.push('/problems');
    } catch (e) {
      console.error("Error deleting problem:", e);
      error.value = 'Failed to delete the problem. Please try again.';
    }
  };

  // This is the key fix: We no longer use Promise.all, which can hide errors.
  // We now fetch the essential problem details and the auxiliary profile data concurrently but separately.
  watch(() => route.params.slug, (newSlug) => {
    if (newSlug) {
      fetchProblemDetails(newSlug);
      fetchUserProfile();
    } else {
      loading.value = false;
      problem.value = null;
    }
  }, { immediate: true });

  watch(problem, (newProblemValue) => {
    // Clean up old subscriptions
    if (problemChannel) supabase.removeChannel(problemChannel);
    if (solutionsChannel) supabase.removeChannel(solutionsChannel);

    if (newProblemValue) {
        const problemId = newProblemValue.id;
        problemChannel = supabase.channel(`problem-assessment:${problemId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'problems', filter: `id=eq.${problemId}`}, 
            (payload) => {
               if (problem.value) {
                  problem.value.ai_assessment_status = payload.new.ai_assessment_status;
                  problem.value.ai_fact_check = payload.new.ai_fact_check;
                  problem.value.ai_parody_probability = payload.new.ai_parody_probability;
                  problem.value.ai_sources = payload.new.ai_sources;
                  problem.value.image_moderation_status = payload.new.image_moderation_status;
                  problem.value.image_moderation_reason = payload.new.image_moderation_reason;
              }
            })
            .subscribe();

        solutionsChannel = supabase.channel(`solution-assessments-for-problem:${problemId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'solutions', filter: `parent_problem=eq.${problemId}`},
            (payload) => {
              if (problem.value && problem.value.solutions) {
                  const index = problem.value.solutions.findIndex(s => s.id === payload.new.id);
                  if (index > -1) {
                      Object.assign(problem.value.solutions[index], payload.new);
                  }
              }
            })
            .subscribe();
    }
  });

  onUnmounted(() => {
    if (problemChannel) supabase.removeChannel(problemChannel);
    if (solutionsChannel) supabase.removeChannel(solutionsChannel);
  });

  return { problem, profile, loading, error, isOwner, handleSolutionDeleted, deleteProblem };
}

