<!-- pages/search.vue -->
<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <h1 class="text-h4 mb-4">Search</h1>
        
        <!-- This is the key change: The entire search UI is now handled by the SearchFeed component -->
        <SearchFeed />
        
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { onMounted } from 'vue';
import SearchFeed from '~/components/SearchFeed.vue';
import { useSearch } from '~/composables/useSearch';

const { searchQuery, searchResults } = useSearch();

// This is a key fix: Clear the search query and results when the page loads
// to prevent showing stale data from previous searches.
onMounted(() => {
    searchQuery.value = '';
    searchResults.value = [];
});
</script>

