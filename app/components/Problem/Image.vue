<!-- components/ProblemImage.vue -->
<template>
    <div v-if="problem.imgs">
      <!-- Moderation is pending -->
      <v-skeleton-loader
        v-if="problem.image_moderation_status === 'pending'"
        type="image"
        height="300"
      >
        <div class="d-flex justify-center align-center fill-height text-caption">
          Image is being moderated...
        </div>
      </v-skeleton-loader>
      
      <!-- Moderation is approved -->
      <v-img
        v-else-if="problem.image_moderation_status === 'approved'"
        :src="getImageUrl(problem.imgs)"
        max-height="500px"
        cover
        class="rounded-lg border"
      ></v-img>

      <!-- Moderation is rejected -->
      <v-alert
        v-else-if="problem.image_moderation_status === 'rejected'"
        type="error"
        variant="tonal"
        icon="mdi-image-off"
        title="Image Rejected"
        :text="`This image was removed by our moderation system. Reason: ${problem.image_moderation_reason || 'Inappropriate content'}`"
      ></v-alert>
    </div>
</template>

<script setup>
import { useSupabaseClient } from '#imports';

defineProps({
    problem: { type: Object, required: true }
});

const supabase = useSupabaseClient();

const getImageUrl = (path) => {
  if (!path) return '';
  const { data } = supabase.storage.from('problems').getPublicUrl(path);
  return data.publicUrl;
};
</script>
