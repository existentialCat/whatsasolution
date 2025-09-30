<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="2" md="4" lg="3" xl="2" class="d-none d-md-block">
          <CategoriesList 
            :counts="problemCountsByCategory"
            @category-selected="handleCategorySelection" 
          />
      </v-col>

      <v-col cols="12" sm="11" md="8" lg="6">
        <h1 class="text-h4 mb-4">Problems</h1>
        <div class="d-md-none mb-4">
           <v-btn @click="mobileDrawer = !mobileDrawer" block variant="tonal" prepend-icon="mdi-filter-variant">
             Filter by Category
           </v-btn>
        </div>
        
        <div v-if="!searchQuery && !isSearching">
          <div v-if="loading" class="text-center py-10">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="mt-4">Loading problems...</p>
          </div>
          <v-card v-else-if="filteredProblems.length" flat class="border rounded-lg mt-4">
            <div v-for="(problem, index) in filteredProblems" :key="problem.id">
              <ProblemCard
                :problem="problem"
                :profile="profile"
                @problemDeleted="handleProblemDeleted"
              />
              <v-divider v-if="index < filteredProblems.length - 1"></v-divider>
            </div>
          </v-card>
          <div v-else class="text-center text-grey py-10">
            <p v-if="selectedCategory">No problems found in the '{{ selectedCategory.replace('-', ' ') }}' category.</p>
            <p v-else>No problems have been submitted yet.</p>
          </div>
        </div>
      </v-col>
    </v-row>
    
    <v-navigation-drawer v-model="mobileDrawer" temporary location="left">
      <CategoriesList 
        :counts="problemCountsByCategory"
        @category-selected="handleCategorySelection" 
      />
    </v-navigation-drawer>
  </v-container>
</template>

<script setup>
// FIX: Added 'onBeforeUnmount' to the import list
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useSearch } from '~/composables/useSearch';
// FIX: Import the 'useDisplay' composable from Vuetify
import { useDisplay } from 'vuetify';
// Component imports added for completeness and clarity

// FIX: Get the current display state from Vuetify
const { mdAndUp } = useDisplay();

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const problems = ref([]);
const profile = ref(null);
const loading = ref(true);
const mobileDrawer = ref(false);
const selectedCategory = ref(null);

const { searchQuery, isLoading: isSearching } = useSearch();

const problemCountsByCategory = computed(() => {
  if (!problems.value || problems.value.length === 0) {
    return { all: 0 };
  }
  
  const counts = problems.value.reduce((acc, problem) => {
    if (problem.category) {
      acc[problem.category] = (acc[problem.category] || 0) + 1;
    }
    return acc;
  }, {});

  counts.all = problems.value.length;
  return counts;
});

const filteredProblems = computed(() => {
  if (!selectedCategory.value) {
    return problems.value;
  }
  return problems.value.filter(p => p.category === selectedCategory.value);
});

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

const handleCategorySelection = (categoryKey) => {
  selectedCategory.value = categoryKey;
  
  if (mobileDrawer.value) {
    mobileDrawer.value = false;
  }
  
  const mainContent = document.querySelector('.v-main');
  if (mainContent) {
    mainContent.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};


onMounted(async () => {
  loading.value = true;
  searchQuery.value = ''; 
  await Promise.all([
    fetchProblems(),
    fetchUserProfile()
  ]);
  loading.value = false;
});

</script>

<style scoped>
</style>