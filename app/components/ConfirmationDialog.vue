<!-- components/ConfirmationDialog.vue -->
<template>
  <v-dialog v-model="dialog" max-width="500" persistent>
    <v-card>
      <v-card-title class="text-h5">{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="dialog = false">Cancel</v-btn>
        <v-btn :color="confirmColor" :loading="loading" @click="onConfirm">{{ confirmText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'Confirm' },
  confirmColor: { type: String, default: 'red-darken-1' },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['confirm']);
const dialog = defineModel({ type: Boolean }); // Use v-model

const onConfirm = () => {
  emit('confirm');
};
</script>