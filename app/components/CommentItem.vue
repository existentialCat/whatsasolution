<!-- components/CommentItem.vue -->
<template>
  <div class="comment-item" :id="`comment-${comment.id}`" :class="{ 'is-reply': isReply }">
    <div v-if="isReply" class="connector-line"></div>
    <v-list-item class="pa-0">
      <template v-slot:prepend>
        <v-avatar color="grey-darken-1" class="mr-4"></v-avatar>
      </template>

      <!-- Display Mode vs. Edit Mode -->
      <div v-if="!isEditing" class="flex-grow-1">
        <v-list-item-title class="font-weight-bold">
          <NuxtLink :to="`/profile/${comment.submitted_by}`" @click.stop class="text-decoration-none text-black">
            {{ comment.users?.username || 'Anonymous' }}
          </NuxtLink>
        </v-list-item-title>
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
        <v-btn icon variant="text" size="small" @click="toggleReplyForm"><v-icon size="small">mdi-comment-outline</v-icon></v-btn>
        <div class="d-flex align-center mr-4">
            <v-btn icon variant="text" size="small" @click="emit('like', comment.id)">
              <v-icon :color="comment.user_liked ? 'pink' : 'inherit'" size="small">{{ comment.user_liked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
            </v-btn>
            <span>{{ comment.likes || 0 }}</span>
        </div>
        <div v-if="comment.replies && comment.replies.length > 0" @click="toggleReplies" class="d-flex align-center reply-toggle">
          <v-icon size="small" class="mr-1">{{ isCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
          <span>{{ comment.replies.length }} {{ comment.replies.length > 1 ? 'replies' : 'reply' }}</span>
        </div>
        <v-spacer></v-spacer>
        <!-- User and Admin Edit/Delete Controls -->
        <v-btn v-if="isOwner(comment) && canEdit(comment)" icon="mdi-pencil" variant="text" size="small" @click="openEditMode"></v-btn>
        <v-btn v-if="isOwner(comment) || profile?.role === 'admin'" icon="mdi-delete" color="red-lighten-1" variant="text" size="small" @click="emit('delete', comment.id)"></v-btn>
      </div>
    </v-list-item>

    <!-- Reply Form -->
    <v-expand-transition>
      <div v-if="showReplyForm" class="ml-16 mt-2">
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
    </v-expand-transition>

    <!-- Nested Replies -->
    <v-expand-transition>
      <div v-show="!isCollapsed" v-if="comment.replies && comment.replies.length > 0" class="replies-container ml-8 mt-4 pl-4">
        <CommentItem
          v-for="reply in comment.replies"
          :key="reply.id"
          :comment="reply"
          :is-reply="true"
          :profile="profile"
          @like="emit('like', $event)"
          @submitReply="emit('submitReply', $event)"
          @delete="emit('delete', $event)"
          @update="emit('update', $event)"
        />
      </div>
    </v-expand-transition>
  </div>
</template>

<style scoped>
.comment-item {
  position: relative;
}
.replies-container {
  padding-left: 20px !important; 
  margin-left: 32px !important;
}
.connector-line {
  position: absolute;
  left: 18px; 
  top: -20px;
  bottom: 0;
  width: 2px;
  background-color: #e0e0e0;
  height: calc(100% + 20px);
}
.v-list-item--prepend .v-avatar {
  margin-inline-end: 16px;
  z-index: 1;
  background: white;
}
.action-bar .v-btn {
  color: #616161;
}
.action-bar span {
  color: #616161;
  font-weight: 500;
}
.reply-toggle {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
}
.reply-toggle:hover {
  color: #1976D2;
}
</style>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSupabaseUser } from '#imports';

defineOptions({
  name: 'CommentItem'
});

const props = defineProps({
  comment: { type: Object, required: true },
  isReply: { type: Boolean, default: false },
  profile: { type: Object, default: null }
});

const emit = defineEmits(['like', 'submitReply', 'delete', 'update']);

const user = useSupabaseUser();
const route = useRoute();
const showReplyForm = ref(false);
const replyText = ref('');
const isCollapsed = ref(true);
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

const toggleReplyForm = () => {
  showReplyForm.value = !showReplyForm.value;
  if (showReplyForm.value) {
    replyText.value = `@${props.comment.users?.username || 'user'} `;
  }
};

const submitReply = () => {
  emit('submitReply', {
    content: replyText.value,
    parentCommentId: props.comment.id,
    onSuccess: () => {
      isCollapsed.value = false;
    }
  });
  replyText.value = '';
  showReplyForm.value = false;
};

const toggleReplies = (event) => {
    const wasCollapsed = isCollapsed.value;
    isCollapsed.value = !isCollapsed.value;
    if (wasCollapsed) {
        const element = event.currentTarget.closest('.comment-item');
        if (!element) return;
        setTimeout(() => {
            const rect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            if (rect.bottom > viewportHeight - 150) {
                element.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
            }
        }, 350);
    }
};

const checkAndExpand = () => {
    const hash = route.hash.replace('#', '');
    if (!hash) return;
    const hasTargetedChild = (c) => {
        if (`comment-${c.id}` === hash) return true;
        return c.replies?.some(hasTargetedChild) || false;
    };
    if (props.comment.replies?.some(hasTargetedChild)) {
        isCollapsed.value = false;
    }
};

checkAndExpand();
watch(() => route.hash, () => { checkAndExpand(); });
</script>

