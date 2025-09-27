<!-- pages/forgot-password.vue -->
<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="6" lg="4">
        <v-card>
          <v-card-title class="text-h5 text-center py-4">Reset Password</v-card-title>
          <v-card-text>
            <p class="text-center mb-4">Enter your email address, and we'll send you a link to reset your password.</p>
            <v-form @submit.prevent="handlePasswordReset">
              <v-alert v-if="message" type="success" dense class="mb-4">{{ message }}</v-alert>
              <v-alert v-if="error" type="error" dense class="mb-4">{{ error }}</v-alert>
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                required
                variant="outlined"
              ></v-text-field>
              <v-btn
                type="submit"
                block
                color="primary"
                :loading="loading"
              >
                Send Reset Link
              </v-btn>
            </v-form>
             <div class="text-center mt-4">
              <NuxtLink to="/login" class="text-decoration-none">Back to Login</NuxtLink>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useSupabaseClient } from '#imports';

const supabase = useSupabaseClient();
const email = ref('');
const loading = ref(false);
const message = ref('');
const error = ref('');

const handlePasswordReset = async () => {
  loading.value = true;
  message.value = '';
  error.value = '';
  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) throw resetError;
    message.value = 'Password reset link sent! Please check your email.';
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};
</script>
