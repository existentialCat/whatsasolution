<!-- components/ProblemCard.vue -->
<template>
  <v-card hover class="d-flex flex-column" style="height: 100%; padding-top: 20px;">
    <div @click="navigateToProblem" style="cursor: pointer;">
      <!-- Image Moderation Display -->
      <v-img
        v-if="problem.imgs && problem.image_moderation_status === 'approved'"
        :src="getImageUrl(problem.imgs)"
        height="200px"
        cover
        class="align-end"
        gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
      >
        <v-card-title class="text-white">{{ problem.title }}</v-card-title>
      </v-img>
      <!-- <div v-else-if="problem.imgs && problem.image_moderation_status === 'pending'" class="d-flex align-center justify-center bg-grey-lighten-3" style="height: 200px;">
        <div class="text-center">
          <v-progress-circular indeterminate size="24" width="2" class="mb-2"></v-progress-circular>
          <div class="text-caption">Image under review</div>
        </div>
      </div>
      <div v-else-if="problem.imgs && problem.image_moderation_status === 'rejected'" class="d-flex align-center justify-center bg-red-lighten-5" style="height: 200px;">
        <div class="text-center text-red-darken-2">
            <v-icon>mdi-image-off</v-icon>
            <div class="text-caption mt-1">Image Rejected</div>
        </div>
      </div> -->
      <v-img v-else :src="getImageUrl(null)" height="200px" cover class="align-end" gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)">
        <v-card-title class="text-white">{{ problem.title }}</v-card-title>
      </v-img>
    </div>
    
    <v-card-subtitle class="pt-4">
      <div class="d-flex align-center pt-2">
         <v-icon small class="mr-1">mdi-lightbulb-on-outline</v-icon>
         <span class="text-body-2">{{ problem.solution_count }} {{ problem.solution_count === 1 ? 'Solution' : 'Solutions' }}</span>
      </div>
    </v-card-subtitle>
    
    <!-- This is the new section for previewing top solutions -->
    <div v-if="problem.top_solutions && problem.top_solutions.length > 0" class="mt-2">
        <v-divider></v-divider>
        <v-list-item
            v-for="solution in problem.top_solutions"
            :key="solution.id"
            :to="`/solutions/${solution.id}`"
            density="compact"
            class="solution-preview"
        >
            <template v-slot:prepend>
                <div class="d-flex flex-column align-center mr-2 text-caption font-weight-medium text-grey-darken-1" style="width: 24px;">
                    <span>{{ solution.net_votes }}</span>
                    <v-icon size="x-small" :color="solution.net_votes > 0 ? 'green' : (solution.net_votes < 0 ? 'red' : 'grey')">
                        {{ solution.net_votes > 0 ? 'mdi-arrow-up' : (solution.net_votes < 0 ? 'mdi-arrow-down' : 'mdi-minus') }}
                    </v-icon>
                </div>
            </template>
            <v-list-item-title class="text-body-2 text-wrap">{{ solution.title }}</v-list-item-title>
        </v-list-item>
    </div>
    <v-card-actions>
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
          <v-card-text>Are you sure you want to delete this problem and all of its solutions? This action cannot be undone.</v-card-text>
          <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="showConfirmDialog = false">Cancel</v-btn>
              <v-btn color="red-darken-1" :loading="isDeleting" @click="deleteProblem">Delete</v-btn>
          </v-card-actions>
      </v-card>
  </v-dialog>
</template>

<style scoped>
.solution-preview:hover {
    background-color: rgba(0,0,0,0.05);
}
</style>

<script setup>
import { ref } from 'vue';
import { useSupabaseClient } from '#imports';
import { useRouter } from 'vue-router';

const props = defineProps({
  problem: { type: Object, required: true, },
  profile: { type: Object, default: null }
});

const emit = defineEmits(['problemDeleted']);

const supabase = useSupabaseClient();
const router = useRouter();

const showConfirmDialog = ref(false);
const isDeleting = ref(false);

const getImageUrl = (path) => {
  if (!path) return '';
  const { data } = supabase.storage.from('problems').getPublicUrl(path);
  return data.publicUrl;
};

const navigateToProblem = () => {
    router.push(`/problems/${props.problem.id}`);
};

const deleteProblem = async () => {
  isDeleting.value = true;
  try {
    const { error } = await supabase.functions.invoke('delete-problem', {
        body: { problem_id: props.problem.id }
    });
    if (error) throw error;
    emit('problemDeleted', props.problem.id);
    showConfirmDialog.value = false;
  } catch(e) {
    console.error("Error deleting problem:", e);
  } finally {
    isDeleting.value = false;
  }
};
</script>

