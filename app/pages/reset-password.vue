<template>
  <v-container>
    <v-row justify="center">
      <v-col>
        <v-card class="pa-4">
          <v-card-title class="text-h5 text-center py-4">Choose a New Password</v-card-title>
          <v-card-text>
            <div v-if="!canUpdate" class="text-center">
              <v-progress-circular indeterminate color="primary" class="mb-4"></v-progress-circular>
              <p class="text-caption">Verifying your recovery link...</p>
              <v-alert v-if="showError" type="error" dense class="mt-4">{{ error }}</v-alert>
            </div>
            
            <v-form v-else @submit.prevent="handlePasswordUpdate">
              <v-alert v-if="message" type="success" dense class="mb-4">{{ message }}</v-alert>
              <v-alert v-if="error" type="error" dense class="mb-4">{{ error }}</v-alert>
              <v-text-field
                v-model="password"
                label="New Password"
                type="password"
                required
                variant="outlined"
                class="mb-2"
              ></v-text-field>
               <v-text-field
                v-model="confirmPassword"
                label="Confirm New Password"
                type="password"
                required
                variant="outlined"
               ></v-text-field>
              <v-btn
                type="submit"
                block
                color="primary"
                :loading="loading"
              >
                Update Password
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions v-if="!canUpdate" class="justify-center pt-2">
            <v-btn
              to="/"
              variant="text"
              color="grey"
            >
              Go Home
            </v-btn>
          </v-card-actions>
          </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useSupabaseClient, useRouter } from '#imports';



const supabase = useSupabaseClient();
const router = useRouter();

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const message = ref('');
const error = ref('');
const canUpdate = ref(false);
const showError = ref(false);
let authListener = null;

definePageMeta({
  layout: 'auth', // Use the 'custom' layout
});

// This is the new, more robust checkRecoverySession function.
const checkRecoverySession = (session) => {
    try {
        if (!session?.access_token) return false;

        // The JWT is in three parts separated by dots. The payload is the middle part.
        const jwtPayload = session.access_token.split('.')[1];
        if (!jwtPayload) return false;

        // Decode the Base64Url payload.
        const decodedPayload = JSON.parse(atob(jwtPayload));
        
        const amr = decodedPayload.amr;
        const isRecovery = amr?.some(a => a.method === 'recovery');

        if (isRecovery) {
            console.log('SUCCESS: Password recovery session detected from JWT.');
            canUpdate.value = true;
            return true;
        }
    } catch (e) {
        console.error("Error decoding JWT or checking AMR:", e);
    }
    console.log("FAILURE: Not a recovery session.");
    return false;
};

const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log(`Supabase auth event fired: ${event}`);
    if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session) {
        checkRecoverySession(session);
    }
});
authListener = data.subscription;

onMounted(() => {
    setTimeout(async () => {
        if (canUpdate.value) return;

        console.log("Proactively checking session in onMounted as a fallback...");
        const { data } = await supabase.auth.getSession();
        if (!checkRecoverySession(data.session)) {
            console.warn('No valid password recovery session found after proactive check.');
            error.value = "Your recovery link may be invalid or expired. Please try again.";
            showError.value = true;
        }
    }, 500);
});

onUnmounted(() => {
    if (authListener) {
        authListener.unsubscribe();
    }
});

const handlePasswordUpdate = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.';
    return;
  }
  loading.value = true;
  message.value = '';
  error.value = '';
  try {
    const { error: updateError } = await supabase.auth.updateUser({ password: password.value });
    if (updateError) throw updateError;
    
    await supabase.auth.signOut();

    message.value = 'Your password has been updated successfully. You will be redirected to the login page.';
    setTimeout(() => router.push('/login'), 3000);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};
</script>