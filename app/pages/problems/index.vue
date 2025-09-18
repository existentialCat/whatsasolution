<!-- pages/problems/index.vue -->
<template>
  <v-container>
    <h1 class="text-h4 mb-4">Problems</h1>
    <div v-if="loading" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4">Loading problems...</p>
    </div>
    <!-- This is the updated layout with a constrained width -->
    <v-row v-else-if="problems.length" justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card flat class="border rounded-lg">
          <div v-for="(problem, index) in problems" :key="problem.id">
            <ProblemCard
              :problem="problem"
              :profile="profile"
              @problemDeleted="handleProblemDeleted"
            />
            <v-divider v-if="index < problems.length - 1"></v-divider>
          </div>
        </v-card>
      </v-col>
    </v-row>
     <div v-else class="text-center text-grey py-10">
        <p>No problems have been submitted yet.</p>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSupabaseClient, useSupabaseUser } from '#imports';

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const problems = ref([]);
const profile = ref(null);
const loading = ref(true);

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
  // Fetch problems and the user's profile at the same time for better performance.
  await Promise.all([
    fetchProblems(),
    fetchUserProfile()
  ]);
  loading.value = false;
});
</script>

