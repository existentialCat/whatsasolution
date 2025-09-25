<!-- pages/problems/index.vue -->
<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <h1 class="text-h4 mb-4">Problems</h1>
        
        <!-- Search Bar -->
        <v-text-field
            v-model="searchQuery"
            label="Search problems and solutions..."
            variant="outlined"
            clearable
            prepend-inner-icon="mdi-magnify"
            class="mb-4"
        ></v-text-field>

        <!-- Loading Indicator -->
        <div v-if="loading" class="text-center py-10">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="mt-4">Loading problems...</p>
        </div>

        <!-- Search Results View -->
        <!-- This is the key fix: Check if searchQuery exists before trimming -->
        <div v-else-if="searchQuery && searchQuery.trim()">
            <div v-if="isSearching" class="text-center py-10">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            <v-card v-else-if="searchResults.length > 0" flat class="border rounded-lg">
                <v-list lines="two" class="py-0">
                    <template v-for="(item, index) in searchResults" :key="item.id">
                        <v-list-item 
                            :to="item.type === 'problem' ? `/problems/${item.slug}` : `/solutions/${item.slug}`" 
                            class="pa-4"
                        >
                             <template v-slot:prepend>
                                <v-avatar class="mr-4">
                                    <v-icon :icon="item.type === 'problem' ? 'mdi-help-box-outline' : 'mdi-lightbulb-on-outline'"></v-icon>
                                </v-avatar>
                             </template>
                             <v-list-item-title class="font-weight-bold text-wrap">{{ item.title }}</v-list-item-title>
                             <v-list-item-subtitle v-if="item.type === 'solution'">
                                 Solution for <NuxtLink :to="`/problems/${item.parent_problem_slug}`" class="text-decoration-none">"{{ item.parent_problem_title }}"</NuxtLink>
                             </v-list-item-subtitle>
                             <v-list-item-subtitle v-else>
                                 Problem by @{{ item.users.username }}
                             </v-list-item-subtitle>
                        </v-list-item>
                        <v-divider v-if="index < searchResults.length - 1"></v-divider>
                    </template>
                </v-list>
            </v-card>
            <div v-else class="text-center text-grey py-16">
                <v-icon size="x-large" class="mb-4">mdi-text-box-search-outline</v-icon>
                <h2 class="text-h6">No results found for "{{ searchQuery }}"</h2>
            </div>
        </div>
        
        <!-- Default Problem Feed View -->
        <div v-else>
            <v-card v-if="problems.length" flat class="border rounded-lg">
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
import { useSearch } from '~/composables/useSearch'; // Import the search composable

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const problems = ref([]);
const profile = ref(null);
const loading = ref(true);

const { searchQuery, searchResults, isLoading: isSearching } = useSearch(); // Use the search state

// Fetches the current user's profile to check their role for admin actions.
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

// Fetches the list of problems using the sorting function.
const fetchProblems = async () => {
  try {
    const { data, error } = await supabase.rpc('get_problems_by_activity');
    if (error) throw error;
    problems.value = data;
  } catch (e) {
    console.error('Error fetching problems:', e);
  }
};

// Removes the deleted problem from the local list for a clean UI update.
const handleProblemDeleted = (deletedProblemId) => {
  problems.value = problems.value.filter(p => p.id !== deletedProblemId);
};

onMounted(async () => {
  loading.value = true;
  // Clear search query when navigating to the page
  searchQuery.value = ''; 
  await Promise.all([
    fetchProblems(),
    fetchUserProfile()
  ]);
  loading.value = false;
});
</script>

