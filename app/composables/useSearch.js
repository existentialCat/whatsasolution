// composables/useSearch.js
import { watch } from 'vue';
import { useSupabaseClient, useState } from '#imports';

export function useSearch() {
  const searchQuery = useState('search-query', () => '');
  const searchResults = useState('search-results', () => []);
  const isLoading = useState('search-loading', () => false);

  const supabase = useSupabaseClient();
  let debounceTimer = null;

  const performSearch = async () => {
    if (!searchQuery.value || !searchQuery.value.trim()) {
      searchResults.value = [];
      isLoading.value = false;
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

  // The watcher for live-search functionality.
  watch(searchQuery, (newValue) => {
    clearTimeout(debounceTimer);
    if (newValue && newValue.trim()) {
      isLoading.value = true;
      debounceTimer = setTimeout(() => {
        performSearch();
      }, 300);
    } else {
      isLoading.value = false;
      searchResults.value = [];
    }
  });

  return {
    searchQuery,
    searchResults,
    isLoading,
    performSearch,
  };
}

