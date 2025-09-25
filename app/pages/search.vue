<!-- pages/search.vue -->
<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <h1 class="text-h4 mb-4">Search</h1>
        <!-- The search field now triggers the search automatically as the user types -->
        <v-text-field
            v-model="searchQuery"
            label="Search for problems or solutions..."
            variant="outlined"
            clearable
            prepend-inner-icon="mdi-magnify"
            autofocus
        ></v-text-field>

        <div v-if="isLoading" class="text-center py-10">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <p class="mt-4">Searching...</p>
        </div>

        <div v-else-if="searchResults.length > 0">
            <v-card flat class="border rounded-lg mt-4">
                <v-list lines="two" class="py-0">
                    <template v-for="(item, index) in searchResults" :key="item.id">
                        <!-- The list item now displays the context for solutions -->
                        <v-list-item 
                            :to="item.type === 'problem' ? `/problems/${item.slug}` : `/solutions/${item.slug}`" 
                            class="pa-4"
                        >
                             <template v-slot:prepend>
                                <v-avatar class="mr-4">
                                    <v-icon :icon="item.type === 'problem' ? 'mdi-help-box-outline' : 'mdi-lightbulb-on-outline'"></v-icon>
                                </v-avatar>
                             </template>
                             <v-list-item-title class="font-weight-bold text-wrap">{{ item.title }}</v-list-item-title>
                             <v-list-item-subtitle v-if="item.type === 'solution'">
                                 Solution for <NuxtLink :to="`/problems/${item.parent_problem_slug}`" class="text-decoration-none">"{{ item.parent_problem_title }}"</NuxtLink>
                             </v-list-item-subtitle>
                             <v-list-item-subtitle v-else>
                                 Problem by @{{ item.users.username }}
                             </v-list-item-subtitle>
                        </v-list-item>
                        <v-divider v-if="index < searchResults.length - 1"></v-divider>
                    </template>
                </v-list>
            </v-card>
        </div>
        
        <div v-else-if="searchQuery.trim() && !isLoading" class="text-center text-grey py-16">
            <v-icon size="x-large" class="mb-4">mdi-text-box-search-outline</v-icon>
            <h2 class="text-h6">No results found for "{{ searchQuery }}"</h2>
            <p>Try a different search term, or create a new problem.</p>
            <v-btn class="mt-4" color="primary" @click="showProblemForm = true">Create New Problem</v-btn>
        </div>
        
        <SubmitProblemDialog v-if="user" v-model="showProblemForm" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useSupabaseUser } from '#imports';
import { useSearch } from '~/composables/useSearch';
import SubmitProblemDialog from '~/components/SubmitProblemDialog.vue';

const user = useSupabaseUser();
const { searchQuery, searchResults, isLoading } = useSearch();
const showProblemForm = ref(false);
</script>

