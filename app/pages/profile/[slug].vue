<!-- pages/profile/[slug].vue -->
<template>
  <div v-if="isLoading" class="d-flex justify-center align-center" style="height: 80vh;">
    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
  </div>
  <v-container v-else-if="profile">
    <!-- Profile Header -->
    <v-card flat class="mb-6">
      <div class="position-relative">
        <v-img
          class="bg-grey-lighten-2"
          height="200"
          cover
          :src="profile.cover_url || 'https://picsum.photos/1200/400?random'"
        >
          <template v-slot:placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
            </div>
          </template>
        </v-img>
        <v-btn
          v-if="isOwnProfile"
          icon="mdi-camera"
          class="position-absolute"
          style="top: 16px; right: 16px; z-index: 1;"
          @click="triggerFileUpload('cover')"
          :loading="isUploading && imageTypeToUpload === 'cover'"
          title="Upload Cover Photo"
        ></v-btn>
      </div>
      <div class="d-flex justify-space-between align-end px-4" style="margin-top: -64px;">
        <div class="position-relative">
          <v-avatar color="white" size="128" class="border">
             <v-img v-if="profile.avatar_url" :src="profile.avatar_url" :alt="profile.username"></v-img>
             <v-avatar v-else color="primary" size="120">
               <span class="text-h2 white--text">{{ profile.username.charAt(0).toUpperCase() }}</span>
             </v-avatar>
          </v-avatar>
          <v-btn
            v-if="isOwnProfile"
            icon="mdi-camera"
            size="small"
            class="position-absolute"
            style="bottom: 10px; right: 10px; z-index: 1;"
            @click="triggerFileUpload('avatar')"
            :loading="isUploading && imageTypeToUpload === 'avatar'"
            title="Upload Avatar"
          ></v-btn>
        </div>
        
        

        <!-- This is the new Settings Menu -->
        <v-menu v-if="isOwnProfile" location="bottom end">
            <template v-slot:activator="{ props }">
                <v-btn v-bind="props" icon="mdi-cog" color="primary" variant="tonal"></v-btn>
            </template>
            <v-list>
                <v-list-item @click="showUpdatePassword = true">
                    <template v-slot:prepend><v-icon>mdi-lock-reset</v-icon></template>
                    <v-list-item-title>Update Password</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>

      </div>
      <v-card-text class="pt-4">
        <h1 class="text-h5 font-weight-bold">{{ profile.username }}</h1>
        <p class="text-grey">@{{ profile.username }}</p>
      </v-card-text>
    </v-card>

    <!-- Content Tabs -->
    <v-tabs v-model="tab" color="primary" grow>
      <v-tab value="problems">Problems</v-tab>
      <v-tab value="solutions">Solutions</v-tab>
      <v-tab value="replies">Replies</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="mt-5">
      <!-- Problems Feed -->
      <v-window-item value="problems">
        <v-list lines="one" v-if="problems.length > 0">
          <v-list-item
            v-for="problem in problems"
            :key="problem.id"
            :title="problem.title"
            :to="`/problems/${problem.slug}`"
            class="border-b"
          >
              <template v-slot:prepend>
                <v-icon>mdi-help-box</v-icon>
              </template>
          </v-list-item>
        </v-list>
        <div v-else class="text-center text-grey py-8">
            <p>This user hasn't submitted any problems yet.</p>
        </div>
      </v-window-item>

      <!-- Solutions Feed -->
      <v-window-item value="solutions">
        <div v-if="groupedSolutions.length > 0">
          <div v-for="group in groupedSolutions" :key="group.problem_id" class="mb-6">
              <h3 class="text-h6 font-weight-medium mb-2">
                <NuxtLink :to="`/problems/${group.problem_slug}`" class="text-decoration-none text-primary">{{ group.problem_title }}</NuxtLink>
              </h3>
              <v-list lines="one" class="border rounded">
                <v-list-item
                  v-for="solution in group.solutions"
                  :key="solution.id"
                  :title="solution.title"
                  :to="`/solutions/${solution.slug}`"
                >
                  <template v-slot:prepend>
                    <v-icon>mdi-lightbulb-on</v-icon>
                  </template>
                </v-list-item>
              </v-list>
          </div>
        </div>
        <div v-else class="text-center text-grey py-8">
            <p>This user hasn't submitted any solutions yet.</p>
        </div>
      </v-window-item>

      <!-- Replies Feed -->
      <v-window-item value="replies">
         <v-list lines="two" v-if="comments.length > 0">
           <v-list-item
            v-for="comment in comments"
            :key="comment.id"
            :title="`&quot;${comment.content}&quot;`"
            :subtitle="`In reply to a solution for: ${comment.solutions?.problems?.title || 'a problem'}`"
            :to="`/solutions/${comment.solutions.slug}#comment-${comment.id}`"
            class="border-b"
           >
             <template v-slot:prepend>
               <v-icon>mdi-comment-text</v-icon>
             </template>
           </v-list-item>
         </v-list>
        <div v-else class="text-center text-grey py-8">
            <p>This user hasn't replied to any solutions yet.</p>
        </div>
      </v-window-item>
    </v-window>
  </v-container>
  <v-container v-else>
      <div class="text-center py-16">
        <h2 class="text-h6">User profile not found.</h2>
      </div>
  </v-container>

  <input
    ref="fileInput"
    type="file"
    accept="image/png, image/jpeg, image/gif"
    hidden
    @change="handleFileChange"
  />

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
    {{ snackbar.text }}
    <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
    </template>
  </v-snackbar>

  <!-- This is the updated dialog for updating the password -->
    <v-dialog v-model="showUpdatePassword" max-width="500" persistent>
        <v-card>
            <v-card-title class="text-h5">Update Password</v-card-title>
            <v-card-text>
                <v-alert v-if="updateError" type="error" dense class="mb-4">{{ updateError }}</v-alert>
                <v-alert v-if="updateMessage" type="success" dense class="mb-4">{{ updateMessage }}</v-alert>
                <v-text-field
                    v-model="newPassword"
                    label="New Password"
                    type="password"
                    required
                    variant="outlined"
                    class="mb-2"
                ></v-text-field>
                <v-text-field
                    v-model="confirmPassword"
                    label="Confirm New Password"
                    type="password"
                    required
                    variant="outlined"
                ></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="closeUpdatePasswordDialog">Cancel</v-btn>
                <v-btn color="primary" @click="updatePassword" :loading="isUpdatingPassword">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { useRoute } from 'vue-router';

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const route = useRoute();

const profile = ref(null);
const problems = ref([]);
const solutions = ref([]);
const comments = ref([]);
const isLoading = ref(true);
const tab = ref('problems');

const profileSlug = computed(() => route.params.slug);
const isOwnProfile = computed(() => user.value && profile.value && user.value.id === profile.value.id);

// New refs for the update password dialog
const showUpdatePassword = ref(false);
const newPassword = ref('');
const confirmPassword = ref('');
const isUpdatingPassword = ref(false);
const updateError = ref('');
const updateMessage = ref('');

const fileInput = ref(null);
const imageTypeToUpload = ref(''); // 'avatar' or 'cover'
const isUploading = ref(false);
const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
});

const groupedSolutions = computed(() => {
    if (!solutions.value || solutions.value.length === 0) return [];
    
    const groups = solutions.value.reduce((acc, solution) => {
        if (!solution.problems) return acc;
        const { id: problem_id, title: problem_title, slug: problem_slug } = solution.problems;

        if (!acc[problem_id]) {
            acc[problem_id] = { problem_id, problem_title, problem_slug, solutions: [], mostRecentSolutionDate: solution.created_at };
        }
        acc[problem_id].solutions.push(solution);
        return acc;
    }, {});
    
    return Object.values(groups).sort((a, b) => new Date(b.mostRecentSolutionDate) - new Date(a.mostRecentSolutionDate));
});

const fetchData = async (slug) => {
    isLoading.value = true;
    // --- 1. MODIFIED: Fetch avatar_url and cover_url ---
    const { data: profileData } = await supabase.from('users').select('id, username, avatar_url, cover_url').eq('slug', slug).single();
    
    if (profileData) {
        profile.value = profileData;
        const profileId = profileData.id;

        const [problemsRes, solutionsRes, commentsRes] = await Promise.all([
            supabase.from('problems').select('id, title, slug, created_at').eq('submitted_by', profileId).order('created_at', { ascending: false }),
            supabase.from('solutions').select(`id, title, slug, created_at, parent_problem, problems!inner(id, title, slug)`).eq('submitted_by', profileId).order('created_at', { ascending: false }),
            supabase.from('comments').select(`id, content, created_at, solutions!inner(slug, problems!inner(title))`).eq('submitted_by', profileId).order('created_at', { ascending: false })
        ]);

        if (problemsRes.data) problems.value = problemsRes.data;
        if (solutionsRes.data) solutions.value = solutionsRes.data;
        if (commentsRes.data) comments.value = commentsRes.data;
    }
    isLoading.value = false;
};

// --- NEW FUNCTIONS FOR IMAGE UPLOAD ---
const showSnackbar = (text, color = 'success') => {
    snackbar.value.text = text;
    snackbar.value.color = color;
    snackbar.value.show = true;
};

const triggerFileUpload = (imageType) => {
    imageTypeToUpload.value = imageType;
    // Programmatically click the hidden file input
    fileInput.value.click();
};

const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !user.value) return;

    isUploading.value = true;
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', user.value.id);
        formData.append('imageType', imageTypeToUpload.value);

        // Invoke the edge function
        const { data, error } = await supabase.functions.invoke('upload-profile-image', {
            body: formData,
        });

        if (error) throw error;

        // Update the user's profile in the database
        const columnToUpdate = imageTypeToUpload.value === 'avatar' ? 'avatar_url' : 'cover_url';
        
        const { error: updateError } = await supabase
            .from('users')
            .update({ [columnToUpdate]: data.publicUrl })
            .eq('id', user.value.id);

        if (updateError) throw updateError;
        
        // Update the local profile object to reflect the change immediately
        if (profile.value) {
            profile.value[columnToUpdate] = data.publicUrl;
        }

        showSnackbar(`${imageTypeToUpload.value.charAt(0).toUpperCase() + imageTypeToUpload.value.slice(1)} updated successfully!`);

    } catch (err) {
        console.error('Upload failed:', err.message);
        showSnackbar(`Error uploading image: ${err.message}`, 'error');
    } finally {
        isUploading.value = false;
        // Reset the file input so the user can upload the same file again if they wish
        if(event.target) event.target.value = ''; 
    }
};
// --- END NEW FUNCTIONS ---

const closeUpdatePasswordDialog = () => {
    showUpdatePassword.value = false;
    newPassword.value = '';
    confirmPassword.value = '';
    updateError.value = '';
    updateMessage.value = '';
};

const updatePassword = async () => {
    if (newPassword.value !== confirmPassword.value) {
        updateError.value = 'Passwords do not match.';
        return;
    }
    isUpdatingPassword.value = true;
    updateError.value = '';
    updateMessage.value = '';
    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword.value });
        if (error) throw error;
        updateMessage.value = 'Password updated successfully!';
        setTimeout(closeUpdatePasswordDialog, 2000);
    } catch (e) {
        updateError.value = e.message;
    } finally {
        isUpdatingPassword.value = false;
    }
};

watch(profileSlug, (newSlug) => {
    if (newSlug) fetchData(newSlug);
}, { immediate: true });
</script>

<style scoped>
.border {
  border: 4px solid white;
}
.border-b {
    border-bottom: 1px solid rgba(0,0,0,0.12);
}
</style>

