<template>
  <div v-if="isLoading" class="d-flex justify-center align-center" style="height: 80vh;">
    <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
  </div>
  <v-container v-else-if="profile">
    <!-- Profile Header -->
    <v-card flat class="mb-6">
      <v-img
        class="bg-grey-lighten-2"
        height="200"
        cover
        src="https://picsum.photos/1200/400?random"
      ></v-img>
      <div class="d-flex justify-space-between align-end px-4" style="margin-top: -64px;">
        <v-avatar color="white" size="128" class="border">
          <v-avatar color="primary" size="120">
              <span class="text-h2 white--text">{{ profile.username.charAt(0).toUpperCase() }}</span>
          </v-avatar>
        </v-avatar>
        <v-btn color="primary" variant="outlined">Edit Profile</v-btn>
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
            :to="`/problems/${problem.id}`"
            class="border-b"
          >
              <template v-slot:prepend>
                <v-icon>mdi-help-box</v-icon>
              </template>
          </v-list-item>
        </v-list>
        <div v-else class="text-center text-grey py-8">
            <p>You haven't submitted any problems yet.</p>
        </div>
      </v-window-item>

      <!-- Solutions Feed -->
      <v-window-item value="solutions">
        <div v-if="groupedSolutions.length > 0">
          <div v-for="group in groupedSolutions" :key="group.id" class="mb-6">
              <h3 class="text-h6 font-weight-medium mb-2">
                <NuxtLink :to="`/problems/${group.id}`" class="text-decoration-none text-primary">{{ group.title }}</NuxtLink>
              </h3>
              <v-list lines="one" class="border rounded">
                <v-list-item
                  v-for="solution in group.solutions"
                  :key="solution.id"
                  :title="solution.title"
                  :to="`/problems/${solution.parent_problem}#solution-${solution.id}`"
                >
                  <template v-slot:prepend>
                    <v-icon>mdi-lightbulb-on</v-icon>
                  </template>
                </v-list-item>
              </v-list>
          </div>
        </div>
        <div v-else class="text-center text-grey py-8">
            <p>You haven't submitted any solutions yet.</p>
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
            :to="`/solutions/${comment.parent_solution}#comment-${comment.id}`"
            class="border-b"
           >
             <template v-slot:prepend>
               <v-icon>mdi-comment-text</v-icon>
             </template>
           </v-list-item>
         </v-list>
        <div v-else class="text-center text-grey py-8">
            <p>You haven't replied to any solutions yet.</p>
        </div>
      </v-window-item>
    </v-window>
  </v-container>
  <v-container v-else>
      <div class="text-center py-16">
        <h2 class="text-h6">Please log in to view your profile.</h2>
        <v-btn to="/login" color="primary" class="mt-4">Login</v-btn>
      </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useSupabaseClient, useSupabaseUser } from '#imports';

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const profile = ref(null);
const problems = ref([]);
const solutions = ref([]);
const comments = ref([]);
const isLoading = ref(true);
const tab = ref('problems');

// This computed property groups solutions and now also sorts the groups themselves
// so that the problems with the most recent solutions appear first.
const groupedSolutions = computed(() => {
    if (!solutions.value || solutions.value.length === 0) return [];
    
    const groups = solutions.value.reduce((acc, solution) => {
        if (!solution.problems) return acc;

        const problemId = solution.problems.id;
        const problemTitle = solution.problems.title;

        if (!acc[problemId]) {
            acc[problemId] = {
                id: problemId,
                title: problemTitle,
                solutions: [],
                // The first solution in the sorted list is the most recent one for that group.
                mostRecentSolutionDate: solution.created_at
            };
        }
        acc[problemId].solutions.push(solution);
        return acc;
    }, {});
    
    // Sort the groups by the date of their most recent solution.
    return Object.values(groups).sort((a, b) => new Date(b.mostRecentSolutionDate) - new Date(a.mostRecentSolutionDate));
});


onMounted(async () => {
  if (user.value) {
    // This is the updated, more reliable query for fetching comments, now sorted by most recent.
    const commentsQuery = supabase
        .from('comments')
        .select(`
            id,
            content,
            created_at,
            parent_solution,
            solutions!inner (
                parent_problem,
                problems!solutions_parent_problem_fkey (
                    title
                )
            )
        `)
        .eq('submitted_by', user.value.id)
        .order('created_at', { ascending: false });
    
    // The query for solutions has also been improved to sort by most recent.
    const solutionsQuery = supabase
        .from('solutions')
        .select(`
            id,
            title,
            created_at,
            parent_problem,
            problems!solutions_parent_problem_fkey (
                id,
                title
            )
        `)
        .eq('submitted_by', user.value.id)
        .order('created_at', { ascending: false });

    // Fetch all profile data concurrently for better performance.
    const [profileRes, problemsRes, solutionsRes, commentsRes] = await Promise.all([
      supabase.from('users').select('username').eq('id', user.value.id).single(),
      // The problems query is now also sorted by most recent.
      supabase.from('problems').select('id, title, created_at').eq('submitted_by', user.value.id).order('created_at', { ascending: false }),
      solutionsQuery,
      commentsQuery
    ]);

    if (profileRes.data) profile.value = profileRes.data;
    if (problemsRes.data) problems.value = problemsRes.data;
    if (solutionsRes.data) solutions.value = solutionsRes.data;
    if (commentsRes.data) comments.value = commentsRes.data;
  }
  isLoading.value = false;
});
</script>

<style scoped>
.border {
  border: 4px solid white;
}
.border-b {
    border-bottom: 1px solid rgba(0,0,0,0.12);
}
</style>

