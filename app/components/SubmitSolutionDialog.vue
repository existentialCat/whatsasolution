<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600" persistent>
    <v-card>
      <v-card-title class="text-h5">Submit a New Solution</v-card-title>
      <v-card-text>
        <v-alert v-if="submissionError" type="error" dense class="mb-4">
            {{ submissionError }}
        </v-alert>

        <!-- This is the new section for displaying submission limits -->
        <v-alert
          v-if="user && !isExempt"
          border="start"
          variant="tonal"
          density="compact"
          class="mb-4 text-caption"
        >
          You have <strong>{{ solutionsRemaining }} of 5</strong> solutions remaining today.
          <div v-if="timeUntilReset">{{ timeUntilReset }}</div>
        </v-alert>

        <v-form v-model="isFormValid" @submit.prevent="submitSolution">
          <v-text-field 
            ref="titleField"
            v-model="solutionForm.title" 
            label="Solution Title" 
            counter="300"
            :rules="[v => !!v || 'Title is required', v => (v && v.length <= 300) || 'Title must be 300 characters or less']"
          ></v-text-field>
          <v-textarea 
            v-model="solutionForm.description" 
            label="Solution Description (Optional)" 
            counter="900"
            :rules="[v => !v || v.length <= 900 || 'Description must be 900 characters or less']"
          ></v-textarea>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancel</v-btn>
            <v-btn color="primary" type="submit" :loading="isSubmitting" :disabled="!isFormValid || (solutionsRemaining <= 0 && !isExempt)">Submit</v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useSubmissionLimits } from '~/composables/useSubmissionLimits';

const props = defineProps({
  modelValue: Boolean,
  problemId: { type: String, required: true }
});

const emit = defineEmits(['update:modelValue', 'solution-submitted']);

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const { solutionsRemaining, timeUntilReset, isExempt, decrementSolutionCount } = useSubmissionLimits();

const isSubmitting = ref(false);
const isFormValid = ref(false);
const solutionForm = ref({ title: '', description: '' });
const titleField = ref(null);
const submissionError = ref(null);

watch(() => props.modelValue, (isShown) => {
  if (isShown) {
    submissionError.value = null;
    solutionForm.value = { title: '', description: '' };
    nextTick(() => titleField.value?.focus());
  }
});

const submitSolution = async () => {
  if (!isFormValid.value || !user.value) return;
  submissionError.value = null;
  isSubmitting.value = true;
  try {
    const { data: newSolution, error } = await supabase
      .from('solutions')
      .insert({
        title: solutionForm.value.title,
        description: solutionForm.value.description,
        submitted_by: user.value.id,
        parent_problem: props.problemId,
      })
      .select('*, users (username, slug)')
      .single();
    
    if (error) throw error;
    
    decrementSolutionCount();
    emit('solution-submitted', newSolution);
    emit('update:modelValue', false);
    
  } catch (e) {
    console.error('Error submitting solution:', e);
    if (e.message.includes('You have reached your daily submission limit')) {
        submissionError.value = e.message;
    } else {
        submissionError.value = 'An unexpected error occurred. Please try again.';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

