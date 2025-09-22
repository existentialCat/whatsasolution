<!-- pages/solutions/[slug].vue -->
<template>
  <div>
    <div v-if="loading" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading solution...</p>
    </div>
    <v-container v-else-if="error">
      <v-alert type="error" dense>{{ error }}</v-alert>
    </v-container>
    <v-container v-else-if="solution">
      <v-row>
        <v-col cols="12">
          <SolutionHeader :problem="solution.problems" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
            <SolutionDetails :solution="solution" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
            <SolutionAIAssessment startExpanded :solution="solution" />
        </v-col>
      </v-row>
      <v-divider class="my-6"></v-divider>
      <v-row>
        <v-col cols="12">
          <CommentSection :solution-id="solution.id" />
        </v-col>
      </v-row>
    </v-container>
    <!-- This is the "Not Found" state -->
    <v-container v-else class="text-center py-16">
        <h1 class="text-h4">Solution not found</h1>
        <p class="mt-2 text-grey">The link may be broken or the solution may have been removed.</p>
        <v-btn to="/problems" class="mt-6" color="primary">Go to Problems</v-btn>
    </v-container>
  </div>
</template>

<style>
/* This is the new CSS for the highlight animation */
@keyframes flash {
  0% {
    box-shadow: 0 0 0 0 rgba(71, 85, 105, 0.7);
  }
  70% {
    box-shadow: 0 0 10px 20px rgba(71, 85, 105, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(71, 85, 105, 0);
  }
}

.flash-animation {
  animation: flash 2s ease-out;
  border-radius: 8px;
}
</style>

<script setup>
import { useSolution } from '~/composables/useSolution';

// All the page's logic is now cleanly handled by the composable.
const { solution, loading, error } = useSolution();
</script>

