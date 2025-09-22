<!-- pages/problems/[slug].vue -->
<template>
  <div>
    <div v-if="loading" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    <v-container v-else-if="error"><v-alert type="error" dense>{{ error }}</v-alert></v-container>
    
    <div v-else-if="problem">
      <!-- The sticky header is now outside the main v-container for correct positioning -->
       <div class="sticky-header-wrapper">
        <v-container>
          <v-row>
            <v-col cols="12">
              <ProblemStickyHeader 
                :problem="problem" 
                :profile="profile" 
                @delete="showDeleteConfirmDialog = true" 
              />
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- The rest of the page content is in its own container -->
      <v-container>
        <v-row v-if="problem.imgs" class="mt-4">
          <v-col cols="12">
            <ProblemImage :problem="problem" />
          </v-col>
        </v-row>

        <v-row class="mt-4">
          <v-col cols="12">
            <v-card>
              <v-card-title class="d-flex justify-space-between align-center">
                <span class="text-h5">Solutions</span>
                <v-btn v-if="user" color="primary" @click="showSolutionForm = true" :icon="mobile">
                  <v-icon v-if="mobile">mdi-plus</v-icon>
                  <span v-else>Submit Solution</span>
                </v-btn>
              </v-card-title>
              <v-divider></v-divider>
              <SolutionList 
                :solutions="problem.solutions" 
                :profile="profile"
                @solutionDeleted="handleSolutionDeleted"
              />
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <SubmitSolutionDialog
          v-if="problem"
          v-model="showSolutionForm"
          :problem-id="problem.id"
          @solution-submitted="handleSolutionSubmitted"
      />
      <ConfirmationDialog
          v-model="showDeleteConfirmDialog"
          title="Confirm Deletion"
          message="Are you sure you want to delete this problem and all related content? This cannot be undone."
          confirm-text="Delete"
          :loading="isDeleting"
          @confirm="handleDeleteProblem"
      />
    </div>
    <v-container v-else><h1 class="text-h4">Problem not found.</h1></v-container>
  </div>
</template>

<style scoped>
/* This is the CSS for our new wrapper */
.sticky-header-wrapper {
  position: sticky;
  top: 0; /* Stick to the very top */
  z-index: 10;
  
  /* Use a surface color from the theme to hide content scrolling underneath */
  background-color: rgb(var(--v-theme-surface));
  
  /* Add a border to visually separate it from the content below */
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Add some space to the top of the main content so it doesn't start hidden underneath the sticky header */
.page-content {
  padding-top: 24px;
}
</style>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useSupabaseUser } from '#imports';
import { useDisplay } from 'vuetify'; 
import { useProblem } from '~/composables/useProblem';
import { useScrollAndHighlight } from '~/composables/useScrollAndHighlight';

const user = useSupabaseUser();
const { mobile } = useDisplay(); 
const { trigger: highlightElement } = useScrollAndHighlight();
const { problem, profile, loading, error, handleSolutionDeleted, deleteProblem } = useProblem();

const showSolutionForm = ref(false);
const showDeleteConfirmDialog = ref(false);
const isDeleting = ref(false);

const handleSolutionSubmitted = (newSolution) => {
    const newSolutionForUI = {
        ...newSolution,
        upvotes: 0, downvotes: 0, views: 0, comment_count: 0, user_vote: null,
    };
    if (!problem.value.solutions) problem.value.solutions = [];
    problem.value.solutions.unshift(newSolutionForUI);
    nextTick(() => highlightElement(`#solution-${newSolution.id}`));
};

const handleDeleteProblem = async () => {
    isDeleting.value = true;
    await deleteProblem();
    isDeleting.value = false;
    showDeleteConfirmDialog.value = false;
};

watch(loading, (isLoading) => {
    if (!isLoading && problem.value) {
        highlightElement();
    }
});
</script>