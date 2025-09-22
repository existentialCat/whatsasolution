<template>
  <div>
    <div v-if="solutions && solutions.length > 0">
      <div v-for="(solution, index) in solutions" :key="solution.id" :id="`solution-${solution.id}`">
        <!-- Desktop Layout (visible on medium screens and up) -->
        <v-card-text v-if="!mobile" class="d-flex align-start pa-4">
          <div class="d-flex flex-column align-center mr-4">
            <v-btn icon variant="plain" :color="solution.user_vote === 'upvote' ? 'green' : 'grey'" :disabled="votingInProgress.has(solution.id)" @click.stop="handleVote(solution, 'upvote')">
              <v-icon size="x-large">mdi-menu-up</v-icon>
            </v-btn>
            <div class="text-h6 font-weight-bold my-n2">{{ (solution.upvotes || 0) - (solution.downvotes || 0) }}</div>
            <v-btn icon variant="plain" :color="solution.user_vote === 'downvote' ? 'red' : 'grey'" :disabled="votingInProgress.has(solution.id)" @click.stop="handleVote(solution, 'downvote')">
              <v-icon size="x-large">mdi-menu-down</v-icon>
            </v-btn>
          </div>
          <div class="flex-grow-1" style="min-width: 0;">
            <v-card class="solution-card" flat hover @click="navigateToSolution(solution.slug)">
              <v-card-title class="text-h6 pt-0 text-wrap">{{ solution.title }}</v-card-title>
              <v-card-subtitle>
                Submitted by: 
                <NuxtLink :to="`/profile/${solution.users?.slug}`" @click.stop class="text-decoration-none">
                  {{ solution.users?.username || 'Anonymous' }}
                </NuxtLink>
              </v-card-subtitle>
              <v-card-text><p>{{ solution.description }}</p></v-card-text>
            </v-card>
          </div>
          <div class="d-flex flex-column align-end ml-4">
            <div class="d-flex align-center text-grey"><v-icon small class="mr-1">mdi-eye</v-icon><span>{{ solution.views || 0 }}</span></div>
            <div class="d-flex align-center text-grey mt-2"><v-icon small class="mr-1">mdi-comment-text-outline</v-icon><span>{{ solution.comment_count || 0 }}</span></div>
            <div class="mt-auto d-flex">
              <v-btn v-if="isOwner(solution) && canEdit(solution)" icon="mdi-pencil" variant="text" size="small" @click.prevent.stop="openEditDialog(solution)"></v-btn>
              <v-btn v-if="isOwner(solution) || profile?.role === 'admin'" icon="mdi-delete" color="red-lighten-1" variant="text" size="small" @click.prevent.stop="openConfirmDialog(solution)"></v-btn>
            </div>
          </div>
        </v-card-text>

        <!-- Mobile Layout (visible on small screens) -->
        <v-card-text v-else class="pa-4">
            <div @click="navigateToSolution(solution.slug)">
                <v-card-title class="text-h6 pt-0 text-wrap px-0">{{ solution.title }}</v-card-title>
                <v-card-subtitle class="px-0">
                    Submitted by: 
                    <NuxtLink :to="`/profile/${solution.users?.slug}`" @click.stop class="text-decoration-none">
                    {{ solution.users?.username || 'Anonymous' }}
                    </NuxtLink>
                </v-card-subtitle>
                <v-card-text class="px-0"><p>{{ solution.description }}</p></v-card-text>
            </div>
            <v-card-actions class="px-0">
                <!-- Mobile Voting -->
                <v-btn icon variant="text" size="small" :color="solution.user_vote === 'upvote' ? 'green' : 'grey-darken-1'" @click.stop="handleVote(solution, 'upvote')">
                    <v-icon>mdi-arrow-up-bold-outline</v-icon>
                </v-btn>
                <span class="font-weight-bold mx-1">{{ (solution.upvotes || 0) - (solution.downvotes || 0) }}</span>
                <v-btn icon variant="text" size="small" :color="solution.user_vote === 'downvote' ? 'red' : 'grey-darken-1'" @click.stop="handleVote(solution, 'downvote')">
                    <v-icon>mdi-arrow-down-bold-outline</v-icon>
                </v-btn>
                <v-spacer></v-spacer>
                <!-- Mobile Stats and Controls -->
                 <div class="d-flex align-center text-grey-darken-1">
                    <v-icon small class="mr-1">mdi-eye-outline</v-icon><span>{{ solution.views || 0 }}</span>
                    <v-icon small class="ml-3 mr-1">mdi-comment-text-outline</v-icon><span>{{ solution.comment_count || 0 }}</span>
                 </div>
                <v-menu v-if="isOwner(solution) || profile?.role === 'admin'" location="top end">
                    <template v-slot:activator="{ props }">
                        <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small"></v-btn>
                    </template>
                    <v-list>
                        <v-list-item v-if="isOwner(solution) && canEdit(solution)" @click="openEditDialog(solution)">
                            <template v-slot:prepend><v-icon>mdi-pencil</v-icon></template>
                            <v-list-item-title>Edit</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="openConfirmDialog(solution)">
                             <template v-slot:prepend><v-icon>mdi-delete</v-icon></template>
                            <v-list-item-title class="text-red">Delete</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </v-card-actions>
        </v-card-text>
        
        <div class="px-4 pb-2">
            <SolutionAIAssessment :solution="solution" />
        </div>
        
        <v-divider v-if="index < solutions.length - 1"></v-divider>
      </div>
    </div>
    <v-card-text v-else class="text-center py-8">
      <p>No solutions have been submitted for this problem yet.</p>
    </v-card-text>

    <!-- Dialogs -->
    <ConfirmationDialog
      v-model="showConfirmDialog"
      title="Confirm Deletion"
      message="Are you sure you want to delete this solution?"
      confirm-text="Delete"
      :loading="isDeleting"
      @confirm="deleteSolution"
    />
    
    <v-dialog v-model="showEditDialog" max-width="600" persistent>
        <v-card>
            <v-card-title class="text-h5">Edit Solution</v-card-title>
            <v-card-text>
                <v-text-field 
                    v-model="editForm.title" 
                    label="Title"
                    counter="300"
                    :rules="[v => !!v && v.length <= 300 || 'Title must be 300 characters or less']"
                ></v-text-field>
                <v-textarea 
                    v-model="editForm.description" 
                    label="Description (Optional)"
                    counter="900"
                    :rules="[v => !v || v.length <= 900 || 'Description must be 900 characters or less']"
                ></v-textarea>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="showEditDialog = false">Cancel</v-btn>
                <v-btn color="primary" @click="updateSolution" :disabled="!editForm.title.trim() || editForm.title.length > 300 || (editForm.description && editForm.description.length > 900)">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.solution-card {
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}
.solution-card:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
</style>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useDisplay } from 'vuetify';
import { useVoting } from '~/composables/useVoting';
import { usePermissions } from '~/composables/usePermissions';

const props = defineProps({
  solutions: { type: Array, required: true, },
  profile: { type: Object, default: null }
});

const emit = defineEmits(['solutionDeleted']);

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();
const { mobile } = useDisplay();
const { votingInProgress, handleVote } = useVoting();
const { isOwner, canEdit } = usePermissions();

const showConfirmDialog = ref(false);
const isDeleting = ref(false);
const solutionToDelete = ref(null);
const showEditDialog = ref(false);
const solutionToEdit = ref(null);
const editForm = ref({ title: '', description: '' });

const navigateToSolution = (slug) => {
    if (slug) {
        router.push(`/solutions/${slug}`);
    }
};

const openConfirmDialog = (solution) => {
    solutionToDelete.value = solution;
    showConfirmDialog.value = true;
};

const deleteSolution = async () => {
    if (!solutionToDelete.value) return;
    isDeleting.value = true;
    try {
        const { error } = await supabase.from('solutions').delete().eq('id', solutionToDelete.value.id);
        if (error) throw error;
        emit('solutionDeleted', solutionToDelete.value.id);
        showConfirmDialog.value = false;
    } catch (e) {
        console.error("Error deleting solution:", e);
    } finally {
        isDeleting.value = false;
    }
};

const openEditDialog = (solution) => {
    solutionToEdit.value = solution;
    editForm.value.title = solution.title;
    editForm.value.description = solution.description;
    showEditDialog.value = true;
};

const updateSolution = async () => {
    if (!solutionToEdit.value) return;
    try {
        const { data, error } = await supabase
            .from('solutions')
            .update({ title: editForm.value.title, description: editForm.value.description })
            .eq('id', solutionToEdit.value.id)
            .select()
            .single();
        if (error) throw error;
        
        const index = props.solutions.findIndex(s => s.id === data.id);
        if (index !== -1) {
            props.solutions[index].title = data.title;
            props.solutions[index].description = data.description;
        }
        showEditDialog.value = false;
    } catch(e) {
        console.error("Error updating solution:", e);
    }
};
</script>