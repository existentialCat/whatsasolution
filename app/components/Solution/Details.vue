<!-- components/SolutionDetails.vue -->
<template>
  <div>
    <!-- Desktop Layout -->
    <v-card-text v-if="!mobile" class="d-flex align-start pa-4">
      <!-- Voting Column -->
      <div class="d-flex flex-column align-center mr-4">
        <v-btn icon variant="plain" :color="solution.user_vote === 'upvote' ? 'green' : 'grey'" @click.stop="handleVote(solution, 'upvote')" :disabled="votingInProgress.has(solution.id)">
          <v-icon size="x-large">mdi-menu-up</v-icon>
        </v-btn>
        <div class="text-h6 font-weight-bold my-n2">{{ (solution.upvotes || 0) - (solution.downvotes || 0) }}</div>
        <v-btn icon variant="plain" :color="solution.user_vote === 'downvote' ? 'red' : 'grey'" @click.stop="handleVote(solution, 'downvote')" :disabled="votingInProgress.has(solution.id)">
          <v-icon size="x-large">mdi-menu-down</v-icon>
        </v-btn>
      </div>
      <!-- Main Content -->
      <div class="flex-grow-1">
        <h1 class="text-h4 mb-2">{{ solution.title }}</h1>
        <v-card-subtitle class="mb-4">
          Submitted by: 
          <NuxtLink :to="`/profile/${solution.users?.slug}`" class="text-decoration-none">
            {{ solution.users?.username || 'Anonymous' }}
          </NuxtLink>
        </v-card-subtitle>
        <p class="text-body-1">{{ solution.description }}</p>
      </div>
    </v-card-text>
    
    <!-- Mobile Layout -->
    <v-card-text v-else class="pa-4">
        <div>
            <h1 class="text-h5 mb-2">{{ solution.title }}</h1>
            <v-card-subtitle class="px-0 mb-4">
              Submitted by: 
              <NuxtLink :to="`/profile/${solution.users?.slug}`" class="text-decoration-none">
                {{ solution.users?.username || 'Anonymous' }}
              </NuxtLink>
            </v-card-subtitle>
            <p class="text-body-1">{{ solution.description }}</p>
        </div>
        <v-card-actions class="px-0 mt-4">
            <!-- Mobile Voting -->
            <v-btn icon variant="text" size="small" :color="solution.user_vote === 'upvote' ? 'green' : 'grey-darken-1'" @click.stop="handleVote(solution, 'upvote')">
                <v-icon>mdi-arrow-up-bold-outline</v-icon>
            </v-btn>
            <span class="font-weight-bold mx-1">{{ (solution.upvotes || 0) - (solution.downvotes || 0) }}</span>
            <v-btn icon variant="text" size="small" :color="solution.user_vote === 'downvote' ? 'red' : 'grey-darken-1'" @click.stop="handleVote(solution, 'downvote')">
                <v-icon>mdi-arrow-down-bold-outline</v-icon>
            </v-btn>
        </v-card-actions>
    </v-card-text>
  </div>
</template>

<script setup>
import { useDisplay } from 'vuetify';
import { useVoting } from '~/composables/useVoting';

const props = defineProps({
    solution: {
        type: Object,
        required: true
    }
});

const { mobile } = useDisplay();
const { votingInProgress, handleVote } = useVoting();
</script>
