// composables/useTheme.js
import { computed } from 'vue';
import { useSupabaseUser, useSupabaseClient } from '#imports';
import { useTheme as useVuetifyTheme } from 'vuetify';

export function useThemeManager() {
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();
  const vuetifyTheme = useVuetifyTheme();

  // This is the key fix: The `setTheme` function now uses the modern, recommended API.
  const setTheme = (theme) => {
    vuetifyTheme.change(theme);
;
  };

  // Function to fetch and apply the user's saved theme from the database
  const initializeTheme = async () => {
    if (!user.value) {
      setTheme('light');
      return;
    }
    
    try {
      const { data } = await supabase
        .from('users')
        .select('theme')
        .eq('id', user.value.id)
        .single();
      
      if (data && data.theme) {
        setTheme(data.theme);
      } else {
        setTheme('light'); // Fallback to light theme
      }
    } catch (e) {
      console.error("Error fetching user theme:", e);
      setTheme('light');
    }
  };

  // This function now uses the new `setTheme` helper.
  const toggleTheme = async () => {
    const newTheme = vuetifyTheme.global.current.value.dark ? 'light' : 'dark';
    setTheme(newTheme);
    
    if (user.value) {
      try {
        await supabase
          .from('users')
          .update({ theme: newTheme })
          .eq('id', user.value.id);
      } catch(e) {
        console.error("Error updating user theme:", e);
      }
    }
  };

  return {
    initializeTheme,
    toggleTheme,
    currentThemeName: computed(() => vuetifyTheme.global.name.value),
  };
}

