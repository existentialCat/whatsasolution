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
          <v-text-field
            v-model="problemForm.title"
            label="Title"
            required
            counter="300"
            :rules="[
                v => !!v || 'Title is required',
                v => (v && v.length <= 300) || 'Title must be 300 characters or less'
            ]"
          ></v-text-field>
          <v-file-input
            v-model="problemForm.image"
            label="Upload an image (optional)"
            accept="image/*"
            prepend-icon="mdi-camera"
          ></v-file-input>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="closeDialog">Cancel</v-btn>
            <v-btn color="success" type="submit" :loading="isSubmitting">Submit</v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useSupabaseClient, useSupabaseUser, useRouter } from '#imports';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue']);

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();

const submissionError = ref(null);
const isSubmitting = ref(false);
const problemForm = ref({
  title: '',
  image: null,
});

watch(() => props.modelValue, (isShown) => {
  if (isShown) {
    submissionError.value = null;
    problemForm.value = { title: '', image: null };
  }
});

const closeDialog = () => {
  emit('update:modelValue', false);
};

// This is the updated, more reliable submission logic.
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
      // This is the key fix: Get the session asynchronously.
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Could not retrieve user session to upload image.");
      }
      const accessToken = sessionData.session.access_token;

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('submission_id', newProblemId);
      formData.append('filename', fileToUpload.name);

      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-problem-image', {
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
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
      .select('id')
      .single();

    if (error) throw error;
    
    closeDialog();
    router.push(newProblem ? `/problems/${newProblem.id}` : '/problems');
  } catch (error) {
    console.error('Error submitting problem:', error);
    submissionError.value = error.message;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

