// composables/useUserProfile.js
import { useSupabaseClient, useSupabaseUser, useAsyncData } from '#imports';

export function useUserProfile() {
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();

  const { data: profile } = useAsyncData(
    'user-profile-data',
    async () => {
      if (!user.value) return null;
      try {
        // This is the key fix: We now select the 'slug' column.
        const { data, error } = await supabase
          .from('users')
          .select('username, role, slug, avatar_url') // Added slug
          .eq('id', user.value.id)
          .single();
        if (error) throw error;
        return data;
      } catch (e) {
        console.error('Error fetching user profile:', e);
        return null;
      }
    },
    { watch: [user] }
  );

  return { profile };
}

