<template>
  <div>
    <!-- Loading Indicator -->
    <div v-if="loading" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading solution...</p>
    </div>

    <!-- Error Message -->
    <v-container v-else-if="error">
      <v-alert type="error" dense>
        {{ error }}
      </v-alert>
    </v-container>

    <!-- Solution Content -->
    <v-container v-else-if="solution">
      <!-- Parent Problem Context -->
      <v-row>
        <v-col cols="12">
           <v-card variant="tonal" class="mb-6" :to="`/problems/${solution.problems.id}`" hover>
             <v-card-text class="d-flex align-center">
                <v-icon class="mr-3">mdi-lightbulb-on-outline</v-icon>
                <div>
                    <div class="text-caption">Problem:</div>
                    <div class="text-body-1 font-weight-bold">{{ solution.problems.title }}</div>
                </div>
             </v-card-text>
           </v-card>
        </v-col>
      </v-row>

      <!-- Solution Details -->
      <v-row>
        <v-col cols="12">
            <v-card-text class="d-flex align-start pa-4">
              <!-- Voting Column -->
              <div class="d-flex flex-column align-center mr-4">
                 <v-btn icon variant="plain" :color="solution.user_vote === 'upvote' ? 'green' : 'grey'" @click.stop="handleVote(solution, 'upvote')" :disabled="votingInProgress.has(solution.id)">
                    <v-icon size="x-large">mdi-menu-up</v-icon>
                  </v-btn>
                  <div class="text-h6 font-weight-bold my-n2">{{ solution.upvotes - solution.downvotes }}</div>
                  <v-btn icon variant="plain" :color="solution.user_vote === 'downvote' ? 'red' : 'grey'" @click.stop="handleVote(solution, 'downvote')" :disabled="votingInProgress.has(solution.id)">
                    <v-icon size="x-large">mdi-menu-down</v-icon>
                  </v-btn>
              </div>

              <!-- Main Content -->
              <div class="flex-grow-1">
                <h1 class="text-h4 mb-2">{{ solution.title }}</h1>
                <v-card-subtitle class="mb-4">
                  <!-- This is the updated section: The username is now a clickable link -->
                  Submitted by: 
                  <NuxtLink :to="`/profile/${solution.submitted_by}`" class="text-decoration-none">
                    {{ solution.users?.username || 'Anonymous' }}
                  </NuxtLink>
                </v-card-subtitle>
                <p class="text-body-1">{{ solution.description }}</p>
              </div>
            </v-card-text>
        </v-col>
      </v-row>

      <v-divider class="my-6"></v-divider>

      <!-- Comments Section -->
      <v-row>
        <v-col cols="12">
          <CommentsSection :solution-id="solution.id" />
        </v-col>
      </v-row>

    </v-container>
  </div>
</template>

<style>
/* This is the new CSS for the highlight animation */
@keyframes flash {
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7); /* Vuetify primary color with alpha */
  }
  70% {
    box-shadow: 0 0 10px 20px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
}

.flash-animation {
  animation: flash 2s ease-out;
  border-radius: 8px; /* Optional: to make the shadow look nicer */
}
</style>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useVoting } from '~/composables/useVoting';
import { useViews } from '~/composables/useViews';
import CommentsSection from '~/components/CommentsSection.vue';

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const route = useRoute();

const solution = ref(null);
const loading = ref(true);
const error = ref(null);

const { votingInProgress, handleVote } = useVoting();
const { recordSolutionViews } = useViews();

const handleScrollAndHighlight = async () => {
    const hash = route.hash;
    if (!hash) return;

    await nextTick();

    let attempts = 0;
    const maxAttempts = 15; // Try for 1.5 seconds
    const interval = 100; // every 100ms

    const tryToFindElement = () => {
        const element = document.querySelector(hash);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('flash-animation');
            setTimeout(() => {
                element.classList.remove('flash-animation');
            }, 2000);
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(tryToFindElement, interval);
        } else {
            console.warn(`Could not find element with selector: ${hash} after ${maxAttempts} attempts.`);
        }
    };

    tryToFindElement();
};


const fetchSolutionDetails = async () => {
  loading.value = true;
  error.value = null;
  const solutionId = route.params.id;

  try {
    const { data, error: fetchError } = await supabase
      .from('solutions')
      .select(`
        *,
        submitted_by, 
        users (username),
        problems!solutions_parent_problem_fkey (id, title)
      `)
      .eq('id', solutionId)
      .single();

    if (fetchError) throw fetchError;

    let userVote = null;
    if (user.value) {
        const { data: voteData, error: voteError } = await supabase
            .from('solution_votes')
            .select('vote_type')
            .eq('solution_id', solutionId)
            .eq('user_id', user.value.id)
            .limit(1);

        if (voteError) throw voteError;

        if (voteData && voteData.length > 0) {
            userVote = voteData[0].vote_type;
        }
    }

    solution.value = { ...data, user_vote: userVote };
    
    await recordSolutionViews([solutionId]);

  } catch (e) {
    console.error('Error fetching solution details:', e);
    error.value = 'Failed to load the solution.';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
    await fetchSolutionDetails();
});

watch(loading, (isLoading) => {
    if (!isLoading && solution.value) {
        handleScrollAndHighlight();
    }
});

watch(() => route.hash, () => {
    handleScrollAndHighlight();
});
</script>

