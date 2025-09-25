<!-- components/SolutionAIAssessment.vue -->
<template>
  <v-card v-if="solution" variant="tonal" class="mt-4">
    <div @click="isExpanded = !isExpanded" style="cursor: pointer;">
      <v-card-item>
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-overline">Solution Assessment</div>
          </div>
          <div class="d-flex align-center">
            <div v-if="solution.ai_assessment_status === 'pending'" class="d-flex align-center text-caption mr-2">
              <v-progress-circular indeterminate size="16" width="2" class="mr-2"></v-progress-circular>
              Submitting...
            </div>
            <div v-if="solution.ai_assessment_status === 'processing'" class="d-flex align-center text-caption mr-2">
              <v-progress-circular indeterminate size="16" width="2" class="mr-2"></v-progress-circular>
              Analysis in progress...
            </div>
            <div v-else-if="solution.ai_assessment_status === 'completed' && !isExpanded" class="text-caption font-weight-medium mr-2">
              Assessment available
            </div>
            <div v-else-if="!isExpanded" class="text-caption mr-2">
              Analysis failed
            </div>
            <v-icon>{{ isExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </div>
        </div>
      </v-card-item>
    </div>

    <v-expand-transition>
      <div v-show="isExpanded">
        <v-divider></v-divider>
        <v-card-text>
          <div v-if="solution.ai_assessment_status === 'completed'">
            <div class="mb-4">
              <div class="font-weight-bold text-body-2 mb-1">Viability Score:</div>
              <v-progress-linear :model-value="(solution.ai_viability_score || 0) * 100" color="blue-grey" height="20" rounded>
                <strong>{{ ((solution.ai_viability_score || 0) * 100).toFixed(0) }}%</strong>
              </v-progress-linear>
              <p v-if="solution.ai_viability_reason" class="text-caption mt-1 text-grey-darken-1">
                {{ solution.ai_viability_reason }}
              </p>
            </div>
            
            <div v-if="solution.ai_side_effects && solution.ai_side_effects.length > 0">
              <div class="font-weight-bold text-body-2 mb-1">Potential Side Effects:</div>
              <ul class="pl-5 text-body-2">
                <li v-for="(effect, index) in solution.ai_side_effects" :key="index">{{ effect }}</li>
              </ul>
            </div>
          </div>
          <div v-else class="text-caption text-red">
            AI analysis could not be performed for this solution.
          </div>
        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  solution: {
    type: Object,
    required: true
  },
  // This is the new prop to control the initial expanded state.
  startExpanded: {
    type: Boolean,
    default: false
  }
});

const isExpanded = ref(props.startExpanded);

</script>

