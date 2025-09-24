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
  }));

  const user = useSupabaseUser();
  const supabase = useSupabaseClient();

  // We ensure the data fetching and listeners are set up only once.
  if (!isInitialized) {
    isInitialized = true;
    
    const { data } = useAsyncData(
      'user-submission-counts',
      async () => {
        if (!user.value) return { problems_submitted: 0, solutions_submitted: 0, user_role: 'user' };
        try {
          const { data, error } = await supabase.rpc('get_user_submission_counts');
          if (error) throw error;
          return data[0];
        } catch (e) {
          console.error("Error fetching submission counts:", e);
          return { problems_submitted: 0, solutions_submitted: 0, user_role: 'user' };
        }
      },
      { watch: [user] }
    );

    watch(data, (newData) => {
      if (newData) {
        submissionCounts.value.problems = newData.problems_submitted;
        submissionCounts.value.solutions = newData.solutions_submitted;
        submissionCounts.value.role = newData.user_role;
      }
    }, { immediate: true });

    // The problematic line that stored a function in state has been removed.
  }

  const problemsRemaining = computed(() => {
    if (submissionCounts.value.role === 'admin' || submissionCounts.value.role === 'moderator') return Infinity;
    return Math.max(0, PROBLEM_LIMIT - submissionCounts.value.problems);
  });

  const solutionsRemaining = computed(() => {
    if (submissionCounts.value.role === 'admin' || submissionCounts.value.role === 'moderator') return Infinity;
    return Math.max(0, SOLUTION_LIMIT - submissionCounts.value.solutions);
  });

  // Local decrement functions for instant UI feedback
  const decrementProblemCount = () => {
    if (submissionCounts.value.role === 'user') {
      submissionCounts.value.problems++;
    }
  };

  const decrementSolutionCount = () => {
    if (submissionCounts.value.role === 'user') {
      submissionCounts.value.solutions++;
    }
  };

  return { 
    problemsRemaining, 
    solutionsRemaining, 
    isExempt: computed(() => submissionCounts.value.role === 'admin' || submissionCounts.value.role === 'moderator'),
    decrementProblemCount,
    decrementSolutionCount
  };
}

