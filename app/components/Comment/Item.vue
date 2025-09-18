<!-- components/CommentItem.vue -->
<template>
  <div class="comment-item" :id="`comment-${comment.id}`" :class="{ 'is-reply': comment.parent_comment_id }">
    <div v-if="comment.parent_comment_id" class="connector-line"></div>
    <v-list-item class="pa-0">
      <template v-slot:prepend>
        <v-avatar color="grey-darken-1" class="mr-4"></v-avatar>
      </template>

      <!-- Display Mode vs. Edit Mode -->
      <div v-if="!isEditing" class="flex-grow-1">
        <v-list-item-title class="font-weight-bold">
          <NuxtLink :to="`/profile/${comment.submitted_by}`" @click.stop class="text-decoration-none">
            {{ comment.users?.username || 'Anonymous' }}
          </NuxtLink>
        </v-list-item-title>
        <!-- This is the "Replying to" text for replies -->
        <div v-if="comment.replyingToUsername" class="text-caption text-grey-darken-1">
            Replying to <NuxtLink :to="`/profile/${comment.parent_comment_id}`" class="text-primary text-decoration-none">@{{ comment.replyingToUsername }}</NuxtLink>
        </div>
        <p class="py-2 text-body-1">{{ comment.content }}</p>
      </div>
      <div v-else class="flex-grow-1">
          <v-textarea
            v-model="editContent"
            rows="2"
            hide-details
            auto-grow
            density="compact"
            class="mb-2"
            autofocus
            counter="900"
            :rules="[v => v.length <= 900 || 'Comment must be 900 characters or less']"
          ></v-textarea>
          <v-btn size="small" variant="text" @click="isEditing = false">Cancel</v-btn>
          <v-btn size="small" color="primary" @click="updateComment" :disabled="!editContent.trim() || editContent.length > 900">Save</v-btn>
      </div>

      <!-- Action Bar (hidden while editing) -->
      <div class="d-flex align-center mt-2 text-body-2 action-bar" v-if="!isEditing">
        <v-btn icon variant="text" size="small" @click="showReplyForm = !showReplyForm"><v-icon size="small">mdi-comment-outline</v-icon></v-btn>
        <div class="d-flex align-center mr-4">
            <v-btn icon variant="text" size="small" @click="emit('like', comment.id)">
              <v-icon :color="comment.user_liked ? 'pink' : 'inherit'" size="small">{{ comment.user_liked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
            </v-btn>
            <span>{{ comment.likes || 0 }}</span>
        </div>
        <v-spacer></v-spacer>
        <v-btn v-if="isOwner(comment) && canEdit(comment)" icon="mdi-pencil" variant="text" size="small" @click="openEditMode"></v-btn>
        <v-btn v-if="isOwner(comment) || profile?.role === 'admin'" icon="mdi-delete" color="red-lighten-1" variant="text" size="small" @click="emit('delete', comment.id)"></v-btn>
      </div>
    </v-list-item>

    <!-- Reply Form -->
    <div v-if="showReplyForm" class="reply-form-container">
      <v-textarea 
          v-model="replyText" 
          label="Write a reply..." 
          rows="2" 
          hide-details 
          auto-grow 
          density="compact"
          counter="900"
          :rules="[v => v.length <= 900 || 'Reply must be 900 characters or less']"
      ></v-textarea>
      <div class="d-flex justify-end mt-2">
        <v-btn size="small" variant="text" @click="showReplyForm = false">Cancel</v-btn>
        <v-btn size="small" color="primary" @click="submitReply" :disabled="!replyText.trim() || replyText.length > 900">Submit</v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-item.is-reply {
  padding-left: 24px; /* This creates the indentation for replies */
  position: relative;
}

/* This is the vertical thread line */
.connector-line {
  position: absolute;
  left: 18px; /* Aligns with the center of the avatar */
  top: 0px; /* Connects to the divider of the parent comment */
  height: calc(100% - 20px);
  width: 2px;
  background-color: #e0e0e0;
}

.v-list-item--prepend .v-avatar {
  margin-inline-end: 16px;
  z-index: 1;
  background: white; /* Ensure avatar is opaque to sit on top of the line */
}

.reply-form-container {
    padding-left: 56px; /* Aligns the reply form with the comment content */
    margin-top: 8px;
}

.action-bar .v-btn, .action-bar span {
  color: #616161;
}
</style>

<script setup>
import { ref } from 'vue';
import { useSupabaseUser } from '#imports';

defineOptions({
  name: 'CommentItem'
});

const props = defineProps({
  comment: { type: Object, required: true },
  profile: { type: Object, default: null }
});

const emit = defineEmits(['like', 'submitReply', 'delete', 'update']);

const user = useSupabaseUser();
const showReplyForm = ref(false);
const replyText = ref('');
const isEditing = ref(false);
const editContent = ref('');

const isOwner = (content) => user.value && content && user.value.id === content.submitted_by;
const canEdit = (content) => {
    if (!content.created_at) return false;
    const tenMinutes = 10 * 60 * 1000;
    return new Date() - new Date(content.created_at) < tenMinutes;
};

const openEditMode = () => {
    editContent.value = props.comment.content;
    isEditing.value = true;
};

const updateComment = () => {
    if (!editContent.value.trim() || editContent.value.length > 900) return;
    emit('update', { id: props.comment.id, content: editContent.value });
    isEditing.value = false;
};

const submitReply = () => {
  emit('submitReply', {
    content: replyText.value,
    parentCommentId: props.comment.id,
    onSuccess: () => {} 
  });
  replyText.value = '';
  showReplyForm.value = false;
};
</script>

