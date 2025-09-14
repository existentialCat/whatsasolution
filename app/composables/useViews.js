// This composable centralizes the logic for recording solution views.
import { useSupabaseClient, useSupabaseUser } from '#imports';

export function useViews() {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  const recordSolutionViews = async (solutionIds) => {
    // Ensure we have a logged-in user and an array of IDs to work with.
    if (!user.value || !solutionIds || solutionIds.length === 0) {
      return;
    }
    
    try {
      // Call the Supabase function to increment the view count for the given solutions.
      // The database function itself ensures a user's view is only counted once.
      const { error } = await supabase.rpc('increment_solution_view', {
        p_solution_ids: solutionIds,
        p_user_id: user.value.id
      });
      if (error) throw error;
    } catch(e) {
      // Log errors silently so they don't disrupt the user experience.
      console.error("Error recording solution views:", e);
    }
  };

  return { recordSolutionViews };
}
