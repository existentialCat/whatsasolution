<!-- components/ProblemCard.vue -->
<template>
  <v-card flat class="py-2">
    <v-card-text class="d-flex">
      <!-- Avatar Column -->
      <div class="mr-4">
        <v-avatar color="grey-lighten-2" size="48">
            <span class="text-h6" v-if="problem.users?.username">{{ problem.users.username.charAt(0).toUpperCase() }}</span>
        </v-avatar>
      </div>

      <!-- Main Content Column -->
      <div class="flex-grow-1">
        <!-- User Info -->
        <div class="d-flex justify-space-between align-center">
            <div>
                <NuxtLink :to="`/profile/${problem.submitted_by}`" class="text-decoration-none font-weight-bold text-black">
                    {{ problem.users?.username || 'Anonymous' }}
                </NuxtLink>
                <span class="text-grey-darken-1"> · {{ timeAgo }}</span>
            </div>
            <v-menu v-if="profile?.role === 'admin'" location="bottom end">
                <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-dots-horizontal" variant="text" size="small"></v-btn>
                </template>
                <v-list>
                    <v-list-item @click="showConfirmDialog = true">
                        <template v-slot:prepend><v-icon color="red">mdi-delete</v-icon></template>
                        <v-list-item-title class="text-red">Delete Problem</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </div>

        <!-- Problem Title -->
        <p class="text-body-1 mt-1 text-wrap" @click="navigateToProblem" style="cursor: pointer;">
            {{ problem.title }}
        </p>

        <!-- Image Display -->
        <div v-if="problem.imgs" class="mt-3">
             <v-img
                v-if="problem.image_moderation_status === 'approved'"
                :src="getImageUrl(problem.imgs)"
                max-height="400"
                cover
                class="rounded-lg border"
                @click="navigateToProblem"
              ></v-img>
              <v-skeleton-loader v-else-if="problem.image_moderation_status === 'pending'" type="image"></v-skeleton-loader>
              <v-alert v-else-if="problem.image_moderation_status === 'rejected'" type="error" variant="tonal" density="compact" icon="mdi-image-off">
                Image was rejected by moderation.
              </v-alert>
        </div>
        
        <!-- Top Solutions Preview -->
        <div v-if="problem.top_solutions && problem.top_solutions.length > 0" class="mt-2">
            <v-divider></v-divider>
            <v-list-item
                v-for="solution in problem.top_solutions"
                :key="solution.id"
                :to="`/solutions/${solution.slug}`"
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

        <!-- Action Bar -->
        <v-card-actions class="px-0 mt-2">
            <v-btn icon variant="text" size="small" @click="navigateToProblem">
                <v-icon>mdi-comment-text-outline</v-icon>
            </v-btn>
            <span class="text-body-2 text-grey-darken-1">{{ problem.solution_count }}</span>
            <v-spacer></v-spacer>
            <v-btn icon variant="text" size="small">
                <v-icon>mdi-share-variant-outline</v-icon>
            </v-btn>
        </v-card-actions>
      </div>
    </v-card-text>

    <ConfirmationDialog
      v-model="showConfirmDialog"
      title="Confirm Deletion"
      message="Are you sure you want to delete this problem and all of its solutions? This action cannot be undone."
      confirm-text="Delete"
      :loading="isDeleting"
      @confirm="deleteProblem"
    />
  </v-card>
</template>

<style scoped>
.solution-preview:hover {
    background-color: rgba(0,0,0,0.05);
}
</style>

<script setup>
import { ref, computed } from 'vue';
import { useSupabaseClient } from '#imports';
import { useRouter } from 'vue-router';
import ConfirmationDialog from '~/components/ConfirmationDialog.vue';

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

const timeAgo = computed(() => {
    if (!props.problem.created_at) return '';
    const date = new Date(props.problem.created_at);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
});

const getImageUrl = (path) => {
  if (!path) return 'https://placehold.co/600x200/EEE/31343C?text=No+Image';
  const { data } = supabase.storage.from('problems').getPublicUrl(path);
  return data.publicUrl;
};

const navigateToProblem = () => {
    if (props.problem.slug) {
        router.push(`/problems/${props.problem.slug}`);
    }
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

