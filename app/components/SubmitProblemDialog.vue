<!-- components/SubmitProblemDialog.vue -->
<template>
  <v-dialog :model-value="modelValue" @update:model-value="closeDialog" max-width="600" persistent>
    <v-card>
      <v-card-title class="text-h5">Submit a New Problem</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitProblem">
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
            You have <strong>{{ problemsRemaining }} of 2</strong> problems remaining today.
            <div v-if="timeUntilReset">{{ timeUntilReset }}</div>
          </v-alert>
          <v-text-field
            v-model="problemForm.title"
            label="Title"
            counter="300"
            :rules="[
                v => !!v || 'Title is required',
                v => (v && v.length <= 300) || 'Title must be 300 characters or less'
            ]"
            autofocus
          ></v-text-field>

          <!-- This is the new section for displaying similar problems -->
          <div v-if="isSearchingSimilar" class="text-center pa-4">
            <v-progress-circular indeterminate size="24"></v-progress-circular>
          </div>
          <div v-if="similarProblems.length > 0" class="mb-4">
            <v-list-subheader>Similar problems may already exist:</v-list-subheader>
            <v-list density="compact" class="border rounded-lg">
                <v-list-item
                    v-for="problem in similarProblems"
                    :key="problem.id"
                    :to="`/problems/${problem.slug}`"
                    @click="closeDialog"
                >
                    <v-list-item-title>{{ problem.title }}</v-list-item-title>
                    <v-list-item-subtitle>by @{{ problem.users.username }}</v-list-item-subtitle>
                </v-list-item>
            </v-list>
          </div>

          <v-file-input
            v-model="problemForm.image"
            label="Upload an image (optional)"
            accept="image/*"
            prepend-icon="mdi-camera"
          ></v-file-input>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
            <v-btn color="primary" type="submit" :loading="isSubmitting">Submit as New Problem</v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useSupabaseClient, useSupabaseUser, useRouter } from '#imports';
import { useSubmissionLimits } from '~/composables/useSubmissionLimits';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue']);

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();
const { decrementProblemCount } = useSubmissionLimits();

const submissionError = ref(null);
const isSubmitting = ref(false);
const problemForm = ref({ title: '', image: null });
const similarProblems = ref([]);
const isSearchingSimilar = ref(false);
let debounceTimer = null;

watch(() => props.modelValue, (isShown) => {
  if (isShown) {
    submissionError.value = null;
    problemForm.value = { title: '', image: null };
    similarProblems.value = [];
  }
});

// This is the new watcher that performs the live search for duplicates.
watch(() => problemForm.value.title, (newTitle) => {
    clearTimeout(debounceTimer);
    if (newTitle && newTitle.trim().length > 10) { // Start searching after 10 characters
        isSearchingSimilar.value = true;
        debounceTimer = setTimeout(async () => {
            try {
                const { data, error } = await supabase.rpc('search_problems_and_solutions', {
                    search_term: newTitle
                });
                if (error) throw error;
                // Filter results to only show problems, not solutions
                similarProblems.value = data.filter(item => item.type === 'problem');
            } catch(e) {
                console.error("Error searching for similar problems:", e);
            } finally {
                isSearchingSimilar.value = false;
            }
        }, 500); // 500ms debounce
    } else {
        similarProblems.value = [];
    }
});


const closeDialog = () => {
  emit('update:modelValue', false);
};

const submitProblem = async () => {
  submissionError.value = null;
  if (!problemForm.value.title) return;

  isSubmitting.value = true;
  try {
    if (!user.value) throw new Error('You must be logged in.');

    const newProblemId = crypto.randomUUID();
    let imagePath = null;
    const fileToUpload = Array.isArray(problemForm.value.image) ? problemForm.value.image[0] : problemForm.value.image;

    if (fileToUpload) {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('submission_id', newProblemId);
      formData.append('filename', fileToUpload.name);

      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-problem-image', {
        body: formData,
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
      imagePath = uploadData.path;
    }
    
    const { data: newProblem, error } = await supabase
      .from('problems')
      .insert({
        id: newProblemId,
        title: problemForm.value.title,
        submitted_by: user.value.id,
        imgs: imagePath,
      })
      .select('slug')
      .single();

    if (error) throw error;
    
    decrementProblemCount();
    closeDialog();
    router.push(`/problems/${newProblem.slug}`);

  } catch (error) {
    console.error('Error submitting problem:', error);
    if (error.message.includes('You have reached your daily submission limit')) {
        submissionError.value = error.message;
    } else {
        submissionError.value = 'An unexpected error occurred. Please try again.';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

