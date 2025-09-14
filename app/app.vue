<template>
  <div>
    <!-- By placing v-app here, it becomes the persistent root for Vuetify styles, -->
    <!-- which is a robust way to prevent the flash of unstyled content. -->
    <v-app>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </v-app>
  </div>
</template>

