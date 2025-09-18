<!-- components/SubmitSolutionDialog.vue -->
<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600" persistent>
    <v-card>
      <v-card-title class="text-h5">Submit a New Solution</v-card-title>
      <v-card-text>
        <v-form v-model="isFormValid" @submit.prevent="submitSolution">
          <v-text-field 
            ref="titleField"
            v-model="solutionForm.title" 
            label="Solution Title" 
            counter="300"
            :rules="[v => !!v || 'Title is required', v => (v && v.length <= 300) || 'Title must be 300 characters or less']"
            required
          ></v-text-field>
          <v-textarea 
            v-model="solutionForm.description" 
            label="Solution Description (Optional)" 
            counter="900"
            :rules="[v => !v || v.length <= 900 || 'Description must be 900 characters or less']"
          ></v-textarea>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="$emit('update:modelValue', false)">Cancel</v-btn>
            <v-btn color="primary" type="submit" :loading="isSubmitting" :disabled="!isFormValid || isSubmitting">Submit</v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useSupabaseClient, useSupabaseUser } from '#imports';

const props = defineProps({
  modelValue: Boolean,
  problemId: { type: String, required: true }
});

const emit = defineEmits(['update:modelValue', 'solution-submitted']);

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const isSubmitting = ref(false);
const isFormValid = ref(false);
const solutionForm = ref({ title: '', description: '' });
const titleField = ref(null);

watch(() => props.modelValue, (isShown) => {
  if (isShown) {
    nextTick(() => titleField.value?.focus());
  }
});

const submitSolution = async () => {
  if (!isFormValid.value || !user.value) return;
  isSubmitting.value = true;
  try {
    const { data: newSolution } = await supabase
      .from('solutions')
      .insert({
        title: solutionForm.value.title,
        description: solutionForm.value.description,
        submitted_by: user.value.id,
        parent_problem: props.problemId,
      })
      .select('*, users (username)')
      .single();
    
    emit('solution-submitted', newSolution);
    emit('update:modelValue', false);
    solutionForm.value = { title: '', description: '' };
  } catch (e) {
    console.error('Error submitting solution:', e);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
