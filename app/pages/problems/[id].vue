<!-- pages/problems/[id].vue -->
<template>
  <div>
    <div v-if="loading" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>
    <v-container v-else-if="error"><v-alert type="error" dense>{{ error }}</v-alert></v-container>
    <v-container v-else-if="problem">
      <v-row>
        <v-col cols="12" class="d-flex justify-space-between align-start">
          <div>
            <h1 class="text-h4">{{ problem.title }}</h1>
            <p class="text-subtitle-1">
              Submitted by: 
              <NuxtLink :to="`/profile/${problem.submitted_by}`" class="text-decoration-none">
                {{ problem.users?.username || 'Anonymous' }}
              </NuxtLink>
            </p>
          </div>
          <div>
            <!-- User and Admin Controls for the Problem -->
            <v-btn
              v-if="isOwner(problem) && canEdit(problem)"
              color="grey-darken-1"
              variant="text"
              @click="openEditProblemDialog"
              prepend-icon="mdi-pencil"
            >
              Edit
            </v-btn>
            <v-btn
              v-if="isOwner(problem) || profile?.role === 'admin'"
              color="red-darken-1"
              variant="text"
              @click="showDeleteConfirmDialog = true"
              prepend-icon="mdi-delete"
            >
              Delete
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- AI Assessment Section (Collapsible) -->
      <v-row>
        <v-col cols="12">
          <v-card variant="tonal" class="mb-4">
            <div @click="isAssessmentExpanded = !isAssessmentExpanded" style="cursor: pointer;">
              <v-card-item>
                  <div class="d-flex justify-space-between align-center">
                      <div>
                          <div class="text-overline">AI Assessment</div>
                          <div class="text-caption text-grey">Fact checks powered by Google Gemini</div>
                      </div>
                      <div class="d-flex align-center">
                          <div v-if="problem.ai_assessment_status === 'pending'" class="d-flex align-center text-caption mr-2">
                              <v-progress-circular indeterminate size="16" width="2" class="mr-2"></v-progress-circular>
                              Analysis in progress...
                          </div>
                          <div v-else-if="problem.ai_assessment_status === 'completed' && !isAssessmentExpanded" class="text-caption text-green-darken-1 font-weight-medium mr-2">
                              Fact-check available
                          </div>
                          <div v-else-if="!isAssessmentExpanded" class="text-caption text-red mr-2">
                              Analysis failed
                          </div>
                          <v-icon>{{ isAssessmentExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                      </div>
                  </div>
              </v-card-item>
            </div>
            
            <v-expand-transition>
                <div v-show="isAssessmentExpanded">
                    <v-divider></v-divider>
                    <v-card-text>
                        <div v-if="problem.ai_assessment_status === 'completed'">
                          <p class="text-body-2 mb-2">
                            <span v-for="(part, index) in formattedFactCheck" :key="index">
                                <span v-if="part.type === 'text'">{{ part.content }}</span>
                                <v-tooltip v-else-if="part.type === 'citation'" location="top">
                                    <template v-slot:activator="{ props }">
                                        <span v-bind="props" class="d-inline-block">
                                            <a 
                                              :href="part.source.uri" 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              class="text-decoration-none font-weight-bold"
                                            >
                                                [{{ part.number }}]
                                            </a>
                                        </span>
                                    </template>
                                    <span>{{ part.source.title }}</span>
                                </v-tooltip>
                            </span>
                          </p>
                          <div class="d-flex align-center">
                              <v-chip
                                size="small"
                                :color="getProbabilityColor(problem.ai_parody_probability)"
                                label
                              >
                                {{ (problem.ai_parody_probability * 100).toFixed(0) }}% Parody/Troll Probability
                              </v-chip>
                          </div>
                          <!-- New section to display sources -->
                          <div v-if="problem.ai_sources && problem.ai_sources.length > 0" class="mt-3">
                              <div class="text-caption font-weight-bold">Sources:</div>
                              <ul class="pl-5 text-caption">
                                  <li v-for="(source, index) in problem.ai_sources" :key="index">
                                      <a :href="source.uri" target="_blank" rel="noopener noreferrer" class="text-decoration-none">{{ source.title }}</a>
                                  </li>
                              </ul>
                          </div>
                        </div>
                         <div v-else class="text-caption text-red">
                          Analysis failed or could not be performed.
                         </div>
                    </v-card-text>
                </div>
            </v-expand-transition>
          </v-card>
        </v-col>
      </v-row>

      <!-- Solutions Section -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <span class="text-h5">Solutions</span>
              <v-btn v-if="user" color="primary" @click="showSolutionForm = true">Submit Solution</v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <SolutionList 
              :solutions="problem.solutions" 
              :profile="profile"
              @solutionDeleted="handleSolutionDeleted"
            />
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <v-container v-else><h1 class="text-h4">Problem not found.</h1></v-container>
  </div>

  <!-- Dialogs -->
  <v-dialog v-model="showSolutionForm" max-width="600" persistent>
    <v-card>
      <v-card-title class="text-h5">Submit a New Solution</v-card-title>
      <v-card-text>
        <v-form 
          v-model="isFormValid" 
          @submit.prevent="submitSolution"
          @keydown.ctrl.enter.prevent="submitSolution"
        >
          <v-text-field 
            ref="titleField"
            v-model="solutionForm.title" 
            label="Solution Title" 
            counter="300"
            :rules="[
                v => !!v || 'Title is required',
                v => (v && v.length <= 300) || 'Title must be 300 characters or less'
            ]"
            required
          ></v-text-field>
          <v-textarea 
            v-model="solutionForm.description" 
            label="Solution Description (Optional)" 
            counter="900"
            :rules="[
                v => !v || v.length <= 900 || 'Description must be 900 characters or less'
            ]"
          ></v-textarea>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showSolutionForm = false">Cancel</v-btn>
            <v-btn 
              color="primary" 
              type="submit" 
              :loading="isSubmitting"
              :disabled="!isFormValid || isSubmitting"
            >Submit</v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showDeleteConfirmDialog" max-width="500" persistent>
    <v-card>
      <v-card-title class="text-h5">Confirm Deletion</v-card-title>
      <v-card-text>Are you sure you want to delete this problem and all related content? This cannot be undone.</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="showDeleteConfirmDialog = false">Cancel</v-btn>
        <v-btn color="red-darken-1" :loading="isDeleting" @click="deleteProblem">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showEditProblemDialog" max-width="600" persistent>
      <v-card>
          <v-card-title class="text-h5">Edit Problem Title</v-card-title>
          <v-card-text>
              <v-text-field 
                v-model="editProblemTitle" 
                label="Problem Title"
                counter="300"
                :rules="[
                    v => !!v || 'Title is required',
                    v => (v && v.length <= 300) || 'Title must be 300 characters or less'
                ]"
              ></v-text-field>
          </v-card-text>
          <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="showEditProblemDialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="updateProblem">Save</v-btn>
          </v-card-actions>
      </v-card>
  </v-dialog>
</template>

<style>
/* This is the CSS for the highlight animation */
@keyframes flash {
  0% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7); }
  70% { box-shadow: 0 0 10px 20px rgba(25, 118, 210, 0); }
  100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
}
.flash-animation {
  animation: flash 2s ease-out;
  border-radius: 4px;
}
</style>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSupabaseClient, useSupabaseUser } from '#imports';
import SolutionList from '~/components/SolutionList.vue';
import { useViews } from '~/composables/useViews';

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const route = useRoute();
const router = useRouter();
const { recordSolutionViews } = useViews();

const problem = ref(null);
const profile = ref(null);
const loading = ref(true);
const error = ref(null);
let channel = null;

const isAssessmentExpanded = ref(false);
const showSolutionForm = ref(false);
const isSubmitting = ref(false);
const isFormValid = ref(false);
const solutionForm = ref({ title: '', description: '' });
const titleField = ref(null);

const showDeleteConfirmDialog = ref(false);
const isDeleting = ref(false);
const showEditProblemDialog = ref(false);
const editProblemTitle = ref('');

watch(showSolutionForm, (isShown) => {
  if (isShown) {
    nextTick(() => {
      titleField.value?.focus();
    });
  }
});

const handleScrollAndHighlight = async () => {
    const hash = route.hash;
    if (!hash) return;
    await nextTick();
    let attempts = 0;
    const maxAttempts = 15;
    const interval = 100;
    const tryToFindElement = () => {
        const element = document.querySelector(hash);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('flash-animation');
            setTimeout(() => {
                element.classList.remove('flash-animation');
            }, 2000);
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(tryToFindElement, interval);
        } else {
            console.warn(`Could not find element with selector: ${hash}`);
        }
    };
    tryToFindElement();
};

const formattedFactCheck = computed(() => {
  if (!problem.value?.ai_fact_check) return [{ type: 'text', content: '' }];
  const text = problem.value.ai_fact_check;
  const sources = problem.value.ai_sources || [];
  const parts = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const citationNumber = parseInt(match[1], 10);
    const sourceIndex = citationNumber - 1;
    if (sources[sourceIndex]) {
      parts.push({ type: 'citation', number: citationNumber, source: sources[sourceIndex] });
    } else {
      parts.push({ type: 'text', content: match[0] });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return parts;
});

const getProbabilityColor = (prob) => {
  if (prob === null || prob === undefined) return 'grey';
  if (prob > 0.75) return 'red-darken-1';
  if (prob > 0.5) return 'orange-darken-1';
  return 'green-darken-1';
};

const fetchProblemDetails = async () => {
    const { data, error: rpcError } = await supabase.rpc('get_problem_details', {
        p_problem_id: route.params.id,
        p_user_id: user.value?.id,
    });
    if (rpcError) throw rpcError;
    problem.value = data && data.length > 0 ? data[0] : null;

    if (problem.value && problem.value.solutions) {
        const solutionIds = problem.value.solutions.map(s => s.id);
        await recordSolutionViews(solutionIds);
    }
};

const fetchUserProfile = async () => {
    if (!user.value) return;
    const { data: profileData, error: profileError } = await supabase
        .from('users').select('role, username').eq('id', user.value.id).single();
    if (profileError) throw profileError;
    profile.value = profileData;
};

const handleSolutionDeleted = (deletedSolutionId) => {
    if (problem.value && problem.value.solutions) {
        problem.value.solutions = problem.value.solutions.filter(s => s.id !== deletedSolutionId);
    }
};

const submitSolution = async () => {
  if (!isFormValid.value || !user.value || !problem.value) return;
  isSubmitting.value = true;
  try {
    const { data: newSolution, error: insertError } = await supabase
      .from('solutions')
      .insert({
        title: solutionForm.value.title,
        description: solutionForm.value.description,
        submitted_by: user.value.id,
        parent_problem: problem.value.id,
      })
      .select('*')
      .single();
    if (insertError) throw insertError;
    
    const newSolutionForUI = {
        ...newSolution,
        users: { username: profile.value?.username || user.value.email },
        upvotes: 0,
        downvotes: 0,
        views: 0,
        comment_count: 0,
        user_vote: null,
    };
    if (!problem.value.solutions) {
        problem.value.solutions = [];
    }
    problem.value.solutions.unshift(newSolutionForUI);
    
    showSolutionForm.value = false;
    solutionForm.value = { title: '', description: '' };

    await nextTick();
    const newSolutionElement = document.querySelector(`#solution-${newSolution.id}`);
    if (newSolutionElement) {
        newSolutionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        newSolutionElement.classList.add('flash-animation');
        setTimeout(() => {
            newSolutionElement.classList.remove('flash-animation');
        }, 2000);
    }
  } catch (e) {
    console.error('Error submitting solution:', e);
  } finally {
    isSubmitting.value = false;
  }
};

const isOwner = (content) => {
    return user.value && content && user.value.id === content.submitted_by;
};

const canEdit = (content) => {
    if (!content || !content.created_at) return false;
    const tenMinutes = 10 * 60 * 1000;
    return new Date() - new Date(content.created_at) < tenMinutes;
};

const openEditProblemDialog = () => {
    editProblemTitle.value = problem.value.title;
    showEditProblemDialog.value = true;
};

const updateProblem = async () => {
    if (!problem.value) return;
    try {
        const { data, error: updateError } = await supabase
            .from('problems')
            .update({ title: editProblemTitle.value })
            .eq('id', problem.value.id)
            .select()
            .single();
        if (updateError) throw updateError;
        problem.value.title = data.title;
        showEditProblemDialog.value = false;
    } catch (e) {
        console.error("Error updating problem:", e);
    }
};

const deleteProblem = async () => {
  if (!problem.value) return;
  isDeleting.value = true;
  try {
    const request = profile.value?.role === 'admin' 
      ? supabase.rpc('delete_problem_with_dependencies', { problem_id_to_delete: problem.value.id })
      : supabase.from('problems').delete().eq('id', problem.value.id);
      
    const { error: deleteError } = await request;
    if (deleteError) throw deleteError;
    
    router.push('/problems');
  } catch (e) {
    console.error("Error deleting problem:", e);
    error.value = 'Failed to delete the problem. Please try again.';
    showDeleteConfirmDialog.value = false;
  } finally {
    isDeleting.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  error.value = null;
  const problemId = route.params.id;
  try {
    await Promise.all([fetchProblemDetails(), fetchUserProfile()]);
    
    if (problem.value) {
        channel = supabase.channel(`problem-assessment:${problemId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'problems',
                filter: `id=eq.${problemId}`
            }, (payload) => {
                Object.assign(problem.value, payload.new);
            })
            .subscribe();
    }
  } catch (e) {
    error.value = 'Failed to load page data.';
    console.error(e);
  } finally {
    loading.value = false;
  }
});

watch(loading, (isLoading) => {
    if (!isLoading && problem.value) {
        handleScrollAndHighlight();
    }
});

watch(() => route.hash, () => {
    handleScrollAndHighlight();
});

onUnmounted(() => {
    if (channel) {
        supabase.removeChannel(channel);
    }
});
</script>

