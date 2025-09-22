<template>
  <div>
    <ClientOnly>
      <div v-if="pending" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4">Loading solution...</p>
      </div>

      <v-container v-else-if="error" class="text-center py-16">
          <h1 class="text-h4">Solution not found</h1>
          <p class="mt-2 text-grey">{{ error.message }}</p>
          <v-btn to="/problems" class="mt-6" color="primary">Go to Problems</v-btn>
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

      <template #fallback>
        <div class="text-center pa-10">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4">Loading solution...</p>
        </div>
      </template>
    </ClientOnly>
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
import { watch } from 'vue';
import { useRoute, useSupabaseClient, useAsyncData, createError } from '#imports';
import { useScrollAndHighlight } from '~/composables/useScrollAndHighlight';

const route = useRoute();
const supabase = useSupabaseClient();
const slug = route.params.slug;

const { data: solution, pending, error } = await useAsyncData(
  `solution-${slug}`,
  async () => {
    const { data, error } = await supabase
      .from('solutions')
      .select('*, users(*), problems(*)')
      .eq('slug', slug)
      .single();

    if (error) {
      throw createError({ statusCode: 404, statusMessage: 'Solution Not Found', fatal: true });
    }
    
    return data;
  }
);

// ✅ --- START OF THE FIX ---

// 1. Import and instantiate the composable
const { trigger: triggerScroll } = useScrollAndHighlight();

// 2. Watch the 'solution' data. Once it loads, trigger the scroll and highlight.
watch(solution, (newSolution) => {
  if (newSolution) {
    triggerScroll();
  }
}, {
  immediate: true // Run the watcher immediately on component load
});

// ✅ --- END OF THE FIX ---
</script>