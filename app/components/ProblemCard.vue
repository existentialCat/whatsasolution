<!-- components/ProblemCard.vue -->
<template>
  <v-card hover class="d-flex flex-column" style="height: 100%;">
    <v-img
      :src="getImageUrl(problem.imgs ? problem.imgs[0] : null)"
      height="200px"
      cover
      class="align-end"
      gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
      @click="navigateToProblem"
      style="cursor: pointer;"
    >
      <v-card-title class="text-white">{{ problem.title }}</v-card-title>
    </v-img>

    <v-card-subtitle class="pt-4">
      Submitted by: {{ problem.users?.username || 'Anonymous' }}
    </v-card-subtitle>

    <v-spacer></v-spacer>

    <v-card-actions>
       <div class="d-flex align-center pt-2">
         <v-icon small class="mr-1">mdi-lightbulb-on-outline</v-icon>
         <span class="text-body-2">{{ problem.solution_count }} {{ problem.solution_count === 1 ? 'Solution' : 'Solutions' }}</span>
       </div>
       <v-spacer></v-spacer>
        <!-- Admin Delete Button -->
       <div v-if="profile?.role === 'admin'">
          <v-btn
            icon="mdi-delete"
            color="red-lighten-1"
            variant="text"
            size="small"
            @click.prevent.stop="showConfirmDialog = true"
          ></v-btn>
       </div>
    </v-card-actions>
  </v-card>

   <!-- Confirmation Dialog -->
  <v-dialog v-model="showConfirmDialog" max-width="500" persistent>
    <v-card>
      <v-card-title class="text-h5">Confirm Deletion</v-card-title>
      <v-card-text>
        Are you sure you want to delete this problem and all of its solutions? This action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="showConfirmDialog = false">Cancel</v-btn>
        <v-btn color="red-darken-1" :loading="isDeleting" @click="deleteProblem">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useSupabaseClient } from '#imports';
import { useRouter } from 'vue-router';

const props = defineProps({
  problem: {
    type: Object,
    required: true,
  },
  profile: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['problemDeleted']);

const supabase = useSupabaseClient();
const router = useRouter();

const showConfirmDialog = ref(false);
const isDeleting = ref(false);

const getImageUrl = (path) => {
  if (!path) return 'https://placehold.co/600x400/EEE/31343C?text=No+Image';
  const { data } = supabase.storage.from('problems').getPublicUrl(path);
  return data.publicUrl;
};

const navigateToProblem = () => {
    router.push(`/problems/${props.problem.id}`);
};

const deleteProblem = async () => {
  isDeleting.value = true;
  try {
    const { error } = await supabase.rpc('delete_problem_with_dependencies', {
      problem_id_to_delete: props.problem.id
    });
    if (error) throw error;
    
    // Emit event to parent to update the UI
    emit('problemDeleted', props.problem.id);
    showConfirmDialog.value = false;

  } catch(e) {
    console.error("Error deleting problem:", e);
    // Optionally show an error message to the user
  } finally {
    isDeleting.value = false;
  }
};
</script>

