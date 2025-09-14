<template>
  <v-app-bar app color="primary" dark>
    <v-toolbar-title @click="goHome" style="cursor: pointer;" class="d-flex align-center">
      <span>What's a Solution</span>
      <v-chip
        v-if="profile && (profile.role === 'admin' || profile.role === 'moderator')"
        size="small"
        :color="profile.role === 'admin' ? 'red-darken-2' : 'orange-darken-2'"
        class="ml-3 text-uppercase font-weight-bold"
        label
      >
        {{ profile.role }}
      </v-chip>
    </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-btn text to="/problems">Problems</v-btn>
    <v-btn text v-if="!user" to="/login">Login</v-btn>

    <!-- Notification Bell -->
    <v-menu v-if="user" location="bottom end" transition="slide-y-transition">
        <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" @click="markNotificationsAsRead">
                <v-badge :content="unreadCount" color="error" :model-value="unreadCount > 0">
                    <v-icon>mdi-bell-outline</v-icon>
                </v-badge>
            </v-btn>
        </template>
        <v-list min-width="350" max-height="400">
            <v-list-item v-if="notifications.length === 0">
                <v-list-item-title class="text-grey">You have no new notifications.</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-for="notification in notifications"
              :key="notification.id"
              :to="notification.link"
              :base-color="notification.is_read ? undefined : 'primary'"
            >
              <template v-slot:prepend>
                  <v-icon :icon="notification.icon" size="small"></v-icon>
              </template>
              <v-list-item-title class="text-wrap" v-html="notification.message"></v-list-item-title>
            </v-list-item>
        </v-list>
    </v-menu>

    <v-btn v-if="user" icon @click="showProblemForm = true">
      <v-icon>mdi-plus</v-icon>
    </v-btn>
    <v-menu v-if="user && profile">
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-avatar color="white" size="36">
            <span class="text-h6 text-primary" v-if="profile.username">{{ profile.username.charAt(0).toUpperCase() }}</span>
            <span class="text-h6 text-primary" v-else-if="user.email">{{ user.email.charAt(0).toUpperCase() }}</span>
          </v-avatar>
        </v-btn>
      </template>
      <v-list>
        <v-list-item :to="`/profile/${user.id}`">
          <v-list-item-title>Profile</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleLogout">
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>

  <v-main>
      <v-container>
        <slot />
      </v-container>

      <!-- Problem Creation Dialog -->
      <v-dialog v-model="showProblemForm" max-width="600">
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
                <v-btn color="primary" text @click="showProblemForm = false">Cancel</v-btn>
                <v-btn color="success" type="submit">Submit</v-btn>
              </v-card-actions>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>
  </v-main>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useSupabaseClient, useSupabaseUser, useAsyncData, useRouter } from '#imports';

const user = useSupabaseUser();
const router = useRouter();
const supabase = useSupabaseClient();

const showProblemForm = ref(false);
const submissionError = ref(null);
const problemForm = ref({
  title: '',
  image: null,
});

const notifications = ref([]);
const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);

const formatNotification = (n) => {
    const triggerUser = n.triggering_user?.username || 'Someone';
    const strongUser = `<strong>${triggerUser}</strong>`;
    let message = '';
    let link = '/';
    let icon = 'mdi-message-alert';

    switch(n.type) {
        case 'new_solution':
            message = `${strongUser} posted a solution to your problem.`;
            link = `/solutions/${n.source_solution_id}`;
            icon = 'mdi-lightbulb-on';
            break;
        case 'new_comment':
            message = `${strongUser} commented on your solution.`;
            link = `/solutions/${n.source_solution_id}#comment-${n.source_comment_id}`;
            icon = 'mdi-comment-text';
            break;
        case 'new_reply':
            message = `${strongUser} replied to your comment.`;
            link = `/solutions/${n.source_solution_id}#comment-${n.source_comment_id}`;
            icon = 'mdi-reply';
            break;
        case 'comment_like':
            message = `${strongUser} liked your comment.`;
            link = `/solutions/${n.source_solution_id}#comment-${n.source_comment_id}`;
            icon = 'mdi-heart';
            break;
    }
    return { ...n, message, link, icon };
};


const { data: profile } = useAsyncData(
  'user-profile-layout',
  async () => {
    if (!user.value) return null;
    const { data, error } = await supabase
      .from('users')
      .select('username, role')
      .eq('id', user.value.id)
      .single();
    if (error) console.error('Error fetching user profile in layout:', error);
    return data;
  },
  { watch: [user] }
);

// Fetch initial notifications
useAsyncData(
    'user-notifications',
    async () => {
        if(!user.value) return [];
        const { data, error } = await supabase
            .from('notifications')
            .select('*, triggering_user:triggering_user_id(username)')
            .eq('recipient_user_id', user.value.id)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error("Error fetching notifications:", error);
            return [];
        }
        notifications.value = data.map(formatNotification);
    },
    { watch: [user] }
);

// Real-time notifications subscription
watch(user, (currentUser) => {
    if (!currentUser) return;
    const channel = supabase.channel(`notifications:${currentUser.id}`);
    
    channel
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_user_id=eq.${currentUser.id}`
        }, async (payload) => {
             const { data, error } = await supabase
                .from('users')
                .select('username')
                .eq('id', payload.new.triggering_user_id)
                .single();
             
             if (!error) {
                const newNotification = { ...payload.new, triggering_user: data };
                notifications.value.unshift(formatNotification(newNotification));
             }
        })
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    }
});


const markNotificationsAsRead = async () => {
    if (unreadCount.value === 0) return;

    // Optimistically update UI
    notifications.value.forEach(n => n.is_read = true);

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_user_id', user.value.id)
        .eq('is_read', false);
    
    if (error) console.error("Error marking notifications as read:", error);
};


watch(showProblemForm, (isShown) => {
  if (isShown) {
    submissionError.value = null;
    problemForm.value = { title: '', image: null };
  }
});

const goHome = () => {
  router.push(user.value ? '/problems' : '/');
};

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error logging out:', error.message);
  else router.push('/login');
};

const uploadImage = async (file) => {
  if (!file || !user.value) return null;
  const { data, error } = await supabase.storage
    .from('problems')
    .upload(`${user.value.id}/${Date.now()}-${file.name}`, file, {
      cacheControl: '3600',
      upsert: false,
    });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return data.path;
};

const submitProblem = async () => {
  submissionError.value = null;
  if (!problemForm.value.title) return;

  try {
    if (!user.value) throw new Error('You must be logged in to submit a problem.');
    let imagePath = null;
    const imageInput = problemForm.value.image;
    const fileToUpload = Array.isArray(imageInput) ? imageInput[0] : imageInput;
    if (fileToUpload) imagePath = await uploadImage(fileToUpload);
    
    const { data: newProblem, error } = await supabase
      .from('problems')
      .insert({
        title: problemForm.value.title,
        submitted_by: user.value.id,
        imgs: imagePath ? [imagePath] : [],
      })
      .select('id')
      .single();

    if (error) throw error;
    showProblemForm.value = false;
    router.push(newProblem ? `/problems/${newProblem.id}` : '/problems');
  } catch (error) {
    console.error('Error submitting problem:', error);
    submissionError.value = error.message;
  }
};
</script>

