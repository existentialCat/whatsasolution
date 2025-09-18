// composables/useUserProfile.js
import { useSupabaseClient, useSupabaseUser, useAsyncData } from '#imports';

export function useUserProfile() {
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();

  // This is the key fix: The useAsyncData function now has a try/catch
  // block and will always return a value.
  const { data: profile } = useAsyncData(
    'user-profile-data', // Use a unique key for this data fetch
    async () => {
      if (!user.value) return null; // Always return a value
      try {
        const { data, error } = await supabase
          .from('users')
          .select('username, role')
          .eq('id', user.value.id)
          .single();
        if (error) throw error;
        return data;
      } catch (e) {
        console.error('Error fetching user profile:', e);
        return null; // Explicitly return null on error
      }
    },
    { watch: [user] }
  );

  return { profile };
}
