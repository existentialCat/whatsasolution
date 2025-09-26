<!-- pages/problems/index.vue -->
<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <h1 class="text-h4 mb-4">Problems</h1>
        
        <!-- The SearchFeed component now handles all search UI -->
        <SearchFeed />

        <!-- Default Problem Feed View (only shows if there is no active search) -->
        <div v-if="!searchQuery && !isSearching">
            <div v-if="loading" class="text-center py-10">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <p class="mt-4">Loading problems...</p>
            </div>
            <v-card v-else-if="problems.length" flat class="border rounded-lg mt-4">
              <div v-for="(problem, index) in problems" :key="problem.id">
                <ProblemCard
                  :problem="problem"
                  :profile="profile"
                  @problemDeleted="handleProblemDeleted"
                />
                <v-divider v-if="index < problems.length - 1"></v-divider>
              </div>
            </v-card>
            <div v-else class="text-center text-grey py-10">
                <p>No problems have been submitted yet.</p>
            </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useSearch } from '~/composables/useSearch';

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const problems = ref([]);
const profile = ref(null);
const loading = ref(true);

// Use the search state to conditionally render the correct view
const { searchQuery, isLoading: isSearching } = useSearch();

const fetchUserProfile = async () => {
  if (!user.value) return;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.value.id)
      .single();
    if (error) throw error;
    profile.value = data;
  } catch (e) {
    console.error('Error fetching user profile:', e);
  }
};

const fetchProblems = async () => {
  try {
    const { data, error } = await supabase.rpc('get_problems_by_activity');
    if (error) throw error;
    problems.value = data;
  } catch (e) {
    console.error('Error fetching problems:', e);
  }
};

const handleProblemDeleted = (deletedProblemId) => {
  problems.value = problems.value.filter(p => p.id !== deletedProblemId);
};

onMounted(async () => {
  loading.value = true;
  // This is the key fix: Clear the search query when the page loads.
  // This prevents stale results from being shown when you navigate back to the page.
  searchQuery.value = ''; 
  await Promise.all([
    fetchProblems(),
    fetchUserProfile()
  ]);
  loading.value = false;
});
</script>

