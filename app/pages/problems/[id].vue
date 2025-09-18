<!-- pages/problems/[id].vue -->
<template>
  <div>
    <div v-if="loading" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    <v-container v-else-if="error"><v-alert type="error" dense>{{ error }}</v-alert></v-container>
    <v-container v-else-if="problem">
      <v-row>
        <v-col cols="12">
            <div class="d-flex" :class="mobile ? 'flex-column' : 'justify-space-between align-start'">
                <div class="flex-grow-1" style="min-width: 0;">
                    <h1 class="text-wrap" :class="mobile ? 'text-h5' : 'text-h4'">{{ problem.title }}</h1>
                    <p class="text-subtitle-1 mt-1">
                      Submitted by: 
                      <NuxtLink :to="`/profile/${problem.submitted_by}`" class="text-decoration-none">
                        {{ problem.users?.username || 'Anonymous' }}
                      </NuxtLink>
                    </p>
                </div>
                <div :class="mobile ? 'mt-4 align-self-end' : 'ml-4 flex-shrink-0'">
                    <v-btn v-if="isOwner(problem, user) || profile?.role === 'admin'" color="red-darken-1" :variant="mobile ? 'tonal' : 'text'" @click="showDeleteConfirmDialog = true" :icon="mobile">
                        <v-icon v-if="mobile">mdi-delete</v-icon>
                        <template v-else><v-icon start>mdi-delete</v-icon>Delete</template>
                    </v-btn>
                </div>
            </div>
        </v-col>
      </v-row>

      <v-row> <v-col cols="12"> <ProblemAIAssessment :problem="problem" /> </v-col> </v-row>

      <v-row>
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
    <v-container v-else><h1 class="text-h4">Problem not found.</h1></v-container>

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
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useSupabaseUser } from '#imports';
import { useDisplay } from 'vuetify'; 
import { useProblem } from '~/composables/useProblem';
import { useScrollAndHighlight } from '~/composables/useScrollAndHighlight';

const supabase = useSupabaseClient();

const user = useSupabaseUser();
const { mobile } = useDisplay(); 
const { trigger: highlightElement } = useScrollAndHighlight();
const { problem, profile, loading, error, isOwner, handleSolutionDeleted, deleteProblem } = useProblem();

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

const getImageUrl = (path) => {
  if (!path) return '';
  const { data } = supabase.storage.from('problems').getPublicUrl(path);
  return data.publicUrl;
};

watch(loading, (isLoading) => {
    if (!isLoading && problem.value) {
        highlightElement();
    }
});
</script>