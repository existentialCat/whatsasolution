<template>
  <div>
    <h2 class="text-h5 mb-4">Comments</h2>
    <v-card v-if="user && profile" class="mb-6" flat>
      <v-card-text class="d-flex align-start">
        <v-avatar color="primary" class="mr-4 mt-2">
          <span>{{ profile.username.charAt(0).toUpperCase() }}</span>
        </v-avatar>

        <div class="flex-grow-1">
          <v-textarea
            v-model="newCommentText"
            :label="`Comment as ${profile.username}`"
            rows="2"
            hide-details
            auto-grow
            variant="outlined"
          ></v-textarea>
          <v-card-actions class="px-0">
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              @click="submitTopLevelComment" 
              :disabled="!newCommentText.trim()"
              variant="tonal"
            >
              Submit
            </v-btn>
          </v-card-actions>
        </div>
      </v-card-text>
    </v-card>

    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <div v-else-if="flatComments.length === 0" class="text-center text-grey py-8">
      <p>No comments yet. Be the first to start the conversation!</p>
    </div>

    <v-list v-else lines="three" class="bg-transparent">
      <div v-for="(comment, index) in flatComments" :key="comment.id">
        <CommentItem
          v-if="comment" 
          :comment="comment"
          :profile="profile"
          @like="likeComment"
          @submitReply="addComment"
          @delete="openDeleteDialog"
          @update="updateComment"
        />
        <v-divider v-if="index < flatComments.length - 1" class="my-2"></v-divider>
      </div>
    </v-list>

    <v-dialog v-model="showDeleteDialog" max-width="500" persistent>
      <v-card>
          <v-card-title class="text-h5">Confirm Deletion</v-card-title>
          <v-card-text>Are you sure you want to delete this comment? This action cannot be undone.</v-card-text>
          <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
              <v-btn color="red-darken-1" @click="confirmDelete">Delete</v-btn>
          </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useSupabaseUser } from '#imports';
import { useComments } from '~/composables/useComments';
import { useUserProfile } from '~/composables/useUserProfile';

const props = defineProps({
  solutionId: { type: String, required: true },
});

// --- Logic and data from composables ---
const user = useSupabaseUser();
const { profile } = useUserProfile();
const { 
  flatComments, 
  loading, 
  addComment, 
  deleteComment, 
  updateComment, 
  likeComment 
} = useComments(props.solutionId);

// --- Local UI state ---
const newCommentText = ref('');
const showDeleteDialog = ref(false);
const commentToDeleteId = ref(null);

// --- UI Actions ---
const submitTopLevelComment = async () => {
  await addComment({ content: newCommentText.value });
  newCommentText.value = '';
};

const openDeleteDialog = (commentId) => {
  commentToDeleteId.value = commentId;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  await deleteComment(commentToDeleteId.value);
  showDeleteDialog.value = false;
  commentToDeleteId.value = null;
};
</script>