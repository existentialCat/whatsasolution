<!-- components/AIAssessment.vue -->
<template>
  <v-card variant="tonal" class="mb-4">
    <div @click="isAssessmentExpanded = !isAssessmentExpanded" style="cursor: pointer;">
      <v-card-item>
          <div class="d-flex justify-space-between align-center">
              <div>
                  <div class="text-overline">AI Assessment</div>
                  <div class="text-caption text-grey">Fact checks powered by Google Gemini</div>
              </div>
              <div class="d-flex align-center">
                  <div v-if="problem.ai_assessment_status === 'pending'" class="d-flex align-center text-caption mr-2">
                      <v-progress-circular indeterminate size="16" width="2" class="mr-2"></v-progress-circular>
                      Submitting for fact check...
                  </div>
                  <div v-else-if="problem.ai_assessment_status === 'processing'" class="d-flex align-center text-caption mr-2">
                      <v-progress-circular indeterminate size="16" width="2" class="mr-2"></v-progress-circular>
                      Analysis in progress...
                  </div>
                  <div v-else-if="problem.ai_assessment_status === 'completed' && !isAssessmentExpanded" class="text-caption text-green-darken-1 font-weight-medium mr-2">
                      Fact-check available
                  </div>
                  <div v-else-if="!isAssessmentExpanded" class="text-caption text-red mr-2">
                      Analysis failed
                  </div>
                  <v-icon>{{ isAssessmentExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </div>
          </div>
      </v-card-item>
    </div>
    
    <v-expand-transition>
        <div v-show="isAssessmentExpanded">
            <v-divider></v-divider>
            <v-card-text>
                <div v-if="problem.ai_assessment_status === 'completed'">
                  <p class="text-body-2 mb-2">
                    <span v-for="(part, index) in formattedFactCheck" :key="index">
                        <span v-if="part.type === 'text'">{{ part.content }}</span>
                        <v-tooltip v-else-if="part.type === 'citation'" location="top">
                            <template v-slot:activator="{ props }">
                                <span v-bind="props" class="d-inline-block">
                                    <a 
                                      :href="part.source.uri" 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      class="text-decoration-none font-weight-bold"
                                    >
                                        [{{ part.number }}]
                                    </a>
                                </span>
                            </template>
                            <span>{{ part.source.title }}</span>
                        </v-tooltip>
                    </span>
                  </p>
                  <div class="d-flex align-center">
                      <v-chip
                        size="small"
                        :color="getProbabilityColor(problem.ai_parody_probability)"
                        label
                      >
                        {{ (problem.ai_parody_probability * 100).toFixed(0) }}% Parody/Troll Probability
                      </v-chip>
                  </div>
                  <!-- New section to display sources -->
                  <div v-if="problem.ai_sources && problem.ai_sources.length > 0" class="mt-3">
                      <div class="text-caption font-weight-bold">Sources:</div>
                      <ul class="pl-5 text-caption">
                          <li v-for="(source, index) in problem.ai_sources" :key="index">
                              <a :href="source.uri" target="_blank" rel="noopener noreferrer" class="text-decoration-none">{{ source.title }}</a>
                          </li>
                      </ul>
                  </div>
                </div>
                 <div v-else class="text-caption text-red">
                  Analysis failed or could not be performed.
                 </div>
            </v-card-text>
        </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    problem: {
        type: Object,
        required: true
    }
});

const isAssessmentExpanded = ref(false);

const formattedFactCheck = computed(() => {
  if (!props.problem?.ai_fact_check) {
    return [{ type: 'text', content: '' }];
  }

  const text = props.problem.ai_fact_check;
  const sources = props.problem.ai_sources || [];
  const parts = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const citationNumber = parseInt(match[1], 10);
    const sourceIndex = citationNumber - 1; 

    if (sources[sourceIndex]) {
      parts.push({
        type: 'citation',
        number: citationNumber,
        source: sources[sourceIndex]
      });
    } else {
      parts.push({ type: 'text', content: match[0] });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
});

const getProbabilityColor = (prob) => {
  if (prob === null || prob === undefined) return 'grey';
  if (prob > 0.75) return 'red-darken-1';
  if (prob > 0.5) return 'orange-darken-1';
  return 'green-darken-1';
};
</script>
