// composables/useProblem.js
import { ref, onMounted, onUnmounted } from 'vue';
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
  
  const fetchProblemDetails = async () => {
    const { data, error: rpcError } = await supabase.rpc('get_problem_details', {
        p_problem_id: route.params.id,
        p_user_id: user.value?.id,
    });
    if (rpcError) throw rpcError;
    problem.value = data && data.length > 0 ? data[0] : null;

    if (problem.value && problem.value.solutions) {
        const solutionIds = problem.value.solutions.map(s => s.id);
        await recordSolutionViews(solutionIds);
    }
  };

  const fetchUserProfile = async () => {
    if (!user.value) return;
    const { data: profileData, error: profileError } = await supabase
        .from('users').select('role, username').eq('id', user.value.id).single();
    if (profileError) throw profileError;
    profile.value = profileData;
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

  onMounted(async () => {
    loading.value = true;
    error.value = null;
    const problemId = route.params.id;
    try {
      await Promise.all([fetchProblemDetails(), fetchUserProfile()]);
      
      if (problem.value) {
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
    } catch (e) {
      error.value = 'Failed to load page data.';
      console.error(e);
    } finally {
      loading.value = false;
    }
  });

  onUnmounted(() => {
    if (problemChannel) supabase.removeChannel(problemChannel);
    if (solutionsChannel) supabase.removeChannel(solutionsChannel);
  });

  return { problem, profile, loading, error, isOwner, handleSolutionDeleted, deleteProblem };
}
