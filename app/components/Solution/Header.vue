<!-- components/SolutionHeader.vue -->
<template>
  <v-card v-if="problem" variant="tonal" class="mb-6" :to="`/problems/${problem.id}`" hover>
    <v-card-text class="d-flex align-center">
      <v-icon class="mr-3">mdi-lightbulb-on-outline</v-icon>
      <div>
        <div class="text-caption">Problem:</div>
        <div class="text-body-1 font-weight-bold">{{ problem.title }}</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  problem: {
    type: Object,
    required: true
  }
});
</script>
