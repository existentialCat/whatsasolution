<!-- pages/login.vue -->
<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="pa-4">
          <v-card-title class="text-h5 text-center">
            {{ isRegistering ? 'Create an Account' : 'Login' }}
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="isRegistering ? handleSignUp() : handleLogin()">
              <v-alert v-if="errorMessage" type="error" dense class="mb-4">
                {{ errorMessage }}
              </v-alert>
               <v-alert v-if="successMessage" type="success" dense class="mb-4">
                {{ successMessage }}
              </v-alert>

              <v-text-field
                v-if="isRegistering"
                v-model="username"
                label="Username"
                required
                prepend-inner-icon="mdi-account"
                :rules="[v => !!v || 'Username is required']"
              ></v-text-field>

              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                required
                prepend-inner-icon="mdi-email"
                :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'E-mail must be valid']"
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                required
                prepend-inner-icon="mdi-lock"
                :rules="[v => !!v || 'Password is required']"
              ></v-text-field>

              <!-- This is the new "Confirm Password" field -->
              <v-text-field
                v-if="isRegistering"
                v-model="confirmPassword"
                label="Confirm Password"
                type="password"
                required
                prepend-inner-icon="mdi-lock-check"
                :rules="[v => !!v || 'Password confirmation is required', v => v === password || 'Passwords do not match']"
              ></v-text-field>

              <v-btn
                :loading="loading"
                type="submit"
                color="primary"
                block
                class="mt-4"
              >
                {{ isRegistering ? 'Sign Up' : 'Login' }}
              </v-btn>
            </v-form>

            <v-divider class="my-4">OR</v-divider>

            <v-btn
                block
                variant="outlined"
                @click="handleOAuthLogin('google')"
                :loading="loading"
            >
                <v-icon start>mdi-google</v-icon>
                Sign In with Google
            </v-btn>

          </v-card-text>
          <!-- This is the updated actions section -->
          <v-card-actions class="d-flex justify-space-between align-center">
             <a href="#" @click.prevent="toggleForm" class="text-decoration-none">
               {{ isRegistering ? 'Already have an account? Login' : "Don't have an account? Sign Up" }}
             </a>
             <NuxtLink v-if="!isRegistering" to="/forgot-password" class="text-caption text-decoration-none">Forgot Password?</NuxtLink>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useSupabaseClient, useRouter } from '#imports';

const supabase = useSupabaseClient();
const router = useRouter();

const isRegistering = ref(false); // Controls which form is shown, defaults to login
const username = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref(null);
const successMessage = ref(null);

// This is the new function to handle the Google OAuth sign-in flow
const handleOAuthLogin = async (provider) => {
    loading.value = true;
    errorMessage.value = null;
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/confirm`,
            },
        });
        if (error) throw error;
        // The user will be redirected to Google by Supabase, so no client-side redirect is needed here.
    } catch (error) {
        errorMessage.value = error.message;
        loading.value = false;
    }
};

// Function to toggle between login and register forms
const toggleForm = () => {
  isRegistering.value = !isRegistering.value;
  // Clear any messages and form fields when switching
  errorMessage.value = null;
  successMessage.value = null;
  username.value = '';
  email.value = '';
  password.value = '';
};

const handleLogin = async () => {
    loading.value = true;
    errorMessage.value = null;
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email: email.value,
            password: password.value,
        });
        if (error) throw error;
        router.push('/'); // Redirect to homepage on successful login
    } catch (error) {
        errorMessage.value = error.message;
    } finally {
        loading.value = false;
    }
};

const handleSignUp = async () => {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    // 1. Check if the username is already taken.
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username.value)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // Ignore 'row not found' error
      throw checkError;
    }

    if (existingUser) {
      throw new Error('This username is already taken. Please choose another one.');
    }

    // 2. Proceed with Supabase auth sign-up.
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          username: username.value,
        },
      },
    });

    if (signUpError) throw signUpError;

    // 3. Show success message.
    successMessage.value = "Success! Please check your email to confirm your account.";
  
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};
</script>

