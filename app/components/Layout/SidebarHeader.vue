<!-- /components/Layout/SidebarHeader.vue -->
<template>
  <v-list-item v-if="!mobile" @click="goHome" class="my-2" style="cursor: pointer;">
    <template v-slot:prepend>
      <Logo />
    </template>
    <v-list-item-title class="font-weight-bold text-h6 ml-2">
      What's a Solution
    </v-list-item-title>
  </v-list-item>
  <div v-else class="d-flex justify-center align-center my-4" style="height: 48px;">
    <Logo @click="goHome" style="cursor: pointer;"/>
  </div>
</template>

<script setup>
import { useDisplay } from 'vuetify';
import { useRouter, useSupabaseUser } from '#imports';

const { mobile } = useDisplay();
const router = useRouter();
const user = useSupabaseUser();

const goHome = () => {
  router.push(user.value ? '/problems' : '/');
};
</script>