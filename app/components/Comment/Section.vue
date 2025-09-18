<!-- components/CommentsSection.vue -->
<template>
  <div>
    <h2 class="text-h5 mb-4">Comments</h2>
    <!-- Top-level Comment Submission Form -->
    <v-card v-if="user" class="mb-6">
      <v-card-text>
        <v-textarea
          v-model="newCommentText"
          label="Add a comment..."
          rows="2"
          hide-details
          auto-grow
          counter="900"
          :rules="[
            v => v.length <= 900 || 'Comment must be 900 characters or less'
          ]"
        ></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="submitTopLevelComment" :disabled="!newCommentText.trim() || newCommentText.length > 900">Submit</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Loading/Empty State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <div v-else-if="flatComments.length === 0" class="text-center text-grey py-8">
      <p>No comments yet. Be the first to start the conversation!</p>
    </div>

    <!-- This now renders the new flat list of comments -->
    <v-list v-else lines="three" class="bg-transparent">
      <div v-for="(comment, index) in flatComments" :key="comment.id">
        <CommentItem
          :comment="comment"
          :profile="profile"
          @like="likeComment"
          @submitReply="submitReply"
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
              <v-btn color="red-darken-1" @click="deleteComment">Delete</v-btn>
          </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useRouter } from 'vue-router';

const props = defineProps({
  solutionId: { type: String, required: true },
});

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();

const allComments = ref([]);
const loading = ref(true);
const newCommentText = ref('');
const showDeleteDialog = ref(false);
const commentToDeleteId = ref(null);
const profile = ref(null);

const flatComments = computed(() => {
    const comments = allComments.value;
    if (!comments || comments.length === 0) return [];
    
    const commentMap = new Map(comments.map(c => [c.id, { ...c, replies: [] }]));
    const roots = [];

    for (const comment of commentMap.values()) {
      if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
        const parent = commentMap.get(comment.parent_comment_id);
        comment.replyingToUsername = parent.users?.username || 'user';
        parent.replies.push(comment);
      } else {
        roots.push(comment);
      }
    }
    
    roots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const flatList = [];
    function flatten(commentList) {
        for (const comment of commentList) {
            flatList.push(comment);
            if (comment.replies && comment.replies.length > 0) {
                comment.replies.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
                flatten(comment.replies);
            }
        }
    }
    
    flatten(roots);
    return flatList;
});

const fetchComments = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*, submitted_by, users(username), comment_votes(user_id)')
      .eq('parent_solution', props.solutionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    allComments.value = data.map(comment => ({ ...comment, user_liked: false }));

  } catch (e) {
    console.error('Error fetching comments:', e);
  } finally {
    loading.value = false;
  }
};

const applyUserLikes = () => {
    if(user.value && allComments.value.length > 0) {
        const userId = user.value.id;
        allComments.value.forEach(comment => {
            comment.user_liked = comment.comment_votes.some(vote => vote.user_id === userId);
        });
    }
};

watch(user, () => {
    applyUserLikes();
});

const submitComment = async ({ content, parentCommentId = null, onSuccess = () => {} }) => {
  if (!content.trim() || !user.value) return;
  try {
    const { data: newCommentData, error } = await supabase
      .from('comments')
      .insert({
        content: content,
        parent_solution: props.solutionId,
        submitted_by: user.value.id,
        parent_comment_id: parentCommentId,
      })
      .select('*, users(username)')
      .single();
    if (error) throw error;
    
    allComments.value.push({ ...newCommentData, user_liked: false, comment_votes: [] });
    
    onSuccess();
    await nextTick();
    const newCommentElement = document.querySelector(`#comment-${newCommentData.id}`);
    if (newCommentElement) {
      newCommentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      newCommentElement.classList.add('flash-animation');
      setTimeout(() => { newCommentElement.classList.remove('flash-animation'); }, 2000);
    }
  } catch (e) {
    console.error('Error submitting comment:', e);
  }
};

const submitTopLevelComment = () => {
    submitComment({ content: newCommentText.value });
    newCommentText.value = '';
};

const submitReply = (payload) => {
    submitComment(payload);
};

const likeComment = async (commentId) => {
  if (!user.value) { router.push('/register'); return; }
  const comment = allComments.value.find(c => c.id === commentId);
  if (!comment) return;
  const originalLikedState = comment.user_liked;
  const originalLikes = comment.likes || 0;
  comment.user_liked = !comment.user_liked;
  comment.likes = originalLikes + (comment.user_liked ? 1 : -1);
  try {
    const { error } = await supabase.rpc('toggle_comment_like', { p_comment_id: commentId, p_user_id: user.value.id });
    if (error) throw error;
  } catch (e) {
    console.error('Error toggling comment like:', e);
    comment.user_liked = originalLikedState;
    comment.likes = originalLikes;
  }
};

const openDeleteDialog = (commentId) => {
    commentToDeleteId.value = commentId;
    showDeleteDialog.value = true;
};

const deleteComment = async () => {
    if (!commentToDeleteId.value) return;
    try {
        const { error } = await supabase.from('comments').delete().eq('id', commentToDeleteId.value);
        if (error) throw error;
        
        const removeById = (arr, id) => {
            const index = arr.findIndex(item => item.id === id);
            if (index > -1) {
                arr.splice(index, 1);
                return true;
            }
            return arr.some(item => item.replies && removeById(item.replies, id));
        };
        removeById(allComments.value, commentToDeleteId.value);

    } catch (e) {
        console.error("Error deleting comment:", e);
    } finally {
        showDeleteDialog.value = false;
        commentToDeleteId.value = null;
    }
};

const updateComment = async ({ id, content }) => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .update({ content })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        const findAndUpdate = (commentsArray) => {
             for (const comment of commentsArray) {
                if (comment.id === id) {
                    comment.content = data.content;
                    return true;
                }
                if (comment.replies && findAndUpdate(comment.replies)) {
                    return true;
                }
            }
            return false;
        };
        findAndUpdate(allComments.value);
    } catch(e) {
        console.error("Error updating comment:", e);
    }
};

onMounted(async () => {
  await fetchComments();
  applyUserLikes();
  if (user.value) {
    const { data } = await supabase.from('users').select('role').eq('id', user.value.id).single();
    profile.value = data;
  }
});
</script>

