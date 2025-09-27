<!-- layouts/auth.vue -->
<template>
  <v-main>
    <v-container fluid class="fill-height">
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <slot />
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup>
// This is a purely presentational layout, so no script logic is needed.
</script>