<!-- components/ProblemStickyHeader.vue -->
<template>
  <!-- The component is now just a clean container for the header content -->
  <div>
    <ProblemHeader 
      :problem="problem" 
      :profile="profile" 
      @delete="$emit('delete')" 
    />
    <ProblemAIAssessment :problem="problem" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

const props = defineProps({
  problem: { type: Object, required: true },
  profile: { type: Object, default: null }
});

defineEmits(['delete']);

onMounted(() => {
  console.log('Sticky header content has successfully mounted.');
});
</script>

<style scoped>
/* All positioning styles have been removed from this component */
</style>

