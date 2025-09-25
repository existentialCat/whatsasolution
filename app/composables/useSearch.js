// composables/useSearch.js
import { watch } from 'vue';
import { useSupabaseClient, useState } from '#imports';

// This flag ensures the watcher is only set up once.
let isWatcherInitialized = false;

export function useSearch() {
  // We call useState inside the composable to get the correct Nuxt context.
  // Because it uses a key, the state will be a singleton.
  const searchQuery = useState('search-query', () => '');
  const searchResults = useState('search-results', () => []);
  const isLoading = useState('search-loading', () => false);

  const supabase = useSupabaseClient();
  let debounceTimer = null;

  const performSearch = async () => {
    if (!searchQuery.value.trim()) {
      searchResults.value = [];
      return;
    }
    
    isLoading.value = true;
    try {
      const { data, error } = await supabase.rpc('search_problems_and_solutions', {
        search_term: searchQuery.value,
      });
      if (error) throw error;
      searchResults.value = data;
    } catch (e) {
      console.error("Error performing search:", e);
      searchResults.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  // This is the key fix: We ensure the watcher is set up only once
  // to avoid race conditions and duplicate listeners.
  if (!isWatcherInitialized) {
    isWatcherInitialized = true;
    
    watch(searchQuery, (newValue) => {
      clearTimeout(debounceTimer);
      if (newValue && newValue.trim()) {
        isLoading.value = true; // Show loading immediately
        debounceTimer = setTimeout(() => {
          performSearch();
        }, 300); // 300ms debounce
      } else {
        isLoading.value = false;
        searchResults.value = [];
      }
    });
  }

  return {
    searchQuery,
    searchResults,
    isLoading,
    performSearch,
  };
}

