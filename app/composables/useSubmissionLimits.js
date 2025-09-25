// composables/useSubmissionLimits.js
import { computed, watch } from 'vue';
import { useSupabaseClient, useSupabaseUser, useAsyncData, useState } from '#imports';

// Define the daily limits
const PROBLEM_LIMIT = 5;
const SOLUTION_LIMIT = 10;

// This flag is defined at the top level to ensure it's a true singleton.
let isInitialized = false;

export function useSubmissionLimits() {
  // This is the key fix: We now call useState inside the composable function.
  // Because useState creates a singleton by key, the state will still be shared.
  const submissionCounts = useState('submission-counts', () => ({
    problems: 0,
    solutions: 0,
    role: 'user',
    earliestSubmission: null,
  }));

  const user = useSupabaseUser();
  const supabase = useSupabaseClient();
  const now = ref(new Date());
  let timer = null;

  // We ensure the data fetching and listeners are set up only once.
  if (!isInitialized) {
    isInitialized = true;

    if (process.client) {
      timer = setInterval(() => {
          now.value = new Date();
      }, 60000);
    }
    
    const { data, refresh } = useAsyncData(
      'user-submission-counts',
      async () => {
        if (!user.value) return { problems_submitted: 0, solutions_submitted: 0, user_role: 'user', earliest_submission_at: null };
        try {
          const { data, error } = await supabase.rpc('get_user_submission_counts');
          if (error) throw error;
          return data[0];
        } catch (e) {
          console.error("Error fetching submission counts:", e);
          return { problems_submitted: 0, solutions_submitted: 0, user_role: 'user', earliest_submission_at: null };
        }
      },
      { watch: [user] }
    );

    watch(data, (newData) => {
      if (newData) {
        submissionCounts.value.problems = newData.problems_submitted;
        submissionCounts.value.solutions = newData.solutions_submitted;
        submissionCounts.value.role = newData.user_role;
        submissionCounts.value.earliestSubmission = newData.earliest_submission_at;
      }
    }, { immediate: true });
  }

  const timeUntilReset = computed(() => {
      if (!submissionCounts.value.earliestSubmission) return null;
      
      const resetTime = new Date(new Date(submissionCounts.value.earliestSubmission).getTime() + 24 * 60 * 60 * 1000);
      const diff = resetTime - now.value;
      
      if (diff <= 0) {
        submissionCounts.value.problems = 0;
        submissionCounts.value.solutions = 0;
        submissionCounts.value.earliestSubmission = null;
        return "Limits have reset";
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return `Resets in ${hours}h ${minutes}m`;
  });

  const problemsRemaining = computed(() => {
    if (submissionCounts.value.role === 'admin' || submissionCounts.value.role === 'moderator') return Infinity;
    return Math.max(0, PROBLEM_LIMIT - submissionCounts.value.problems);
  });

  const solutionsRemaining = computed(() => {
    if (submissionCounts.value.role === 'admin' || submissionCounts.value.role === 'moderator') return Infinity;
    return Math.max(0, SOLUTION_LIMIT - submissionCounts.value.solutions);
  });

  const decrementProblemCount = () => {
    if (submissionCounts.value.role === 'user') {
      if (!submissionCounts.value.earliestSubmission) {
        submissionCounts.value.earliestSubmission = new Date().toISOString();
      }
      submissionCounts.value.problems++;
    }
  };

  const decrementSolutionCount = () => {
    if (submissionCounts.value.role === 'user') {
      if (!submissionCounts.value.earliestSubmission) {
        submissionCounts.value.earliestSubmission = new Date().toISOString();
      }
      submissionCounts.value.solutions++;
    }
  };
  
  onUnmounted(() => {
      if (timer) clearInterval(timer);
  });

  return { 
    problemsRemaining, 
    solutionsRemaining, 
    timeUntilReset,
    isExempt: computed(() => submissionCounts.value.role === 'admin' || submissionCounts.value.role === 'moderator'),
    decrementProblemCount,
    decrementSolutionCount
  };
}

