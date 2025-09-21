<!-- pages/index.vue -->
<template>
  <v-container>
    <v-sheet class="d-flex align-center text-center py-16">
        <v-container>
          <v-row justify="center">
            <v-col cols="12" md="8">
              <h1 class="text-h3 text-md-h2 font-weight-bold mb-4">Move Beyond the Noise.</h1>
              <p class="text-h6 font-weight-light">
                A platform for solution-focused discourse. Submit problems, propose solutions, and let AI provide the insights needed for productive conversations.
              </p>
              <div class="mt-8">
                <v-btn href="#join" color="amber" size="x-large" class="text-grey-darken-4">Join the Beta</v-btn>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-sheet>

      <!-- "The Problem" Section -->
      <v-sheet id="about" class="py-16 bg-grey-darken-3">
        <v-container>
          <div class="text-center mb-12">
            <h2 class="text-h4 font-weight-bold">Tired of Online Arguments?</h2>
            <p class="text-body-1 text-grey-lighten-1 mt-4 mx-auto" style="max-width: 600px;">
              Modern social media is built for conflict, not consensus. It's about scoring points and humiliating the "other side." We believe there's a better way.
            </p>
          </div>
          <v-row justify="center" align="stretch">
            <v-col cols="12" md="5">
              <v-card class="pa-6 h-100" variant="outlined" color="red-lighten-1">
                <v-card-title class="text-h5 font-weight-bold">The Old Way: Social Media</v-card-title>
                <v-card-text>
                  <v-list class="bg-transparent" density="compact">
                    <v-list-item prepend-icon="mdi-close-circle-outline">Endless, circular arguments.</v-list-item>
                    <v-list-item prepend-icon="mdi-close-circle-outline">Focus on personal attacks.</v-list-item>
                    <v-list-item prepend-icon="mdi-close-circle-outline">Misinformation spreads rapidly.</v-list-item>
                    <v-list-item prepend-icon="mdi-close-circle-outline">No clear path to a solution.</v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="5">
              <v-card class="pa-6 h-100" variant="outlined" color="green-lighten-1">
                <v-card-title class="text-h5 font-weight-bold">The New Way: WhatsaSolution</v-card-title>
                <v-card-text>
                  <v-list class="bg-transparent" density="compact">
                    <v-list-item prepend-icon="mdi-check-circle-outline">Structured, goal-oriented discussion.</v-list-item>
                    <v-list-item prepend-icon="mdi-check-circle-outline">Focus on the viability of ideas.</v-list-item>
                    <v-list-item prepend-icon="mdi-check-circle-outline">AI-powered fact-checking and analysis.</v-list-item>
                    <v-list-item prepend-icon="mdi-check-circle-outline">A clear goal: find the best solutions.</v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-sheet>

      <!-- How It Works Section -->
      <v-sheet class="py-16">
        <v-container class="text-center">
          <h2 class="text-h4 font-weight-bold mb-12">AI-Powered Discourse, Step-by-Step</h2>
          <v-row>
            <v-col v-for="step in steps" :key="step.title" cols="12" sm="6" md="3">
              <v-avatar :icon="step.icon" color="amber" size="64" class="mb-4 text-grey-darken-4"></v-avatar>
              <h3 class="text-h6 font-weight-bold mb-2">{{ step.title }}</h3>
              <p class="text-body-1 text-grey-lighten-1">{{ step.description }}</p>
            </v-col>
          </v-row>
        </v-container>
      </v-sheet>

      <!-- Vision Section -->
      <v-sheet id="vision" class="py-16 bg-grey-darken-3 text-center">
        <v-container>
           <v-row justify="center">
            <v-col cols="12" md="8">
              <v-icon icon="mdi-domain" size="64" class="text-grey-lighten-2 mb-4"></v-icon>
              <h2 class="text-h4 font-weight-bold">Our Vision for the Future</h2>
              <p class="text-body-1 text-grey-lighten-1 mt-4">
                We envision a world where online platforms unite us to solve problems. Where elected officials can turn to a structured, data-driven consensus to guide policy that truly serves the people.
              </p>
            </v-col>
          </v-row>
        </v-container>
      </v-sheet>
      
      <!-- CTA Section -->
      <v-sheet id="join" class="py-16 text-center">
        <v-container>
          <v-row justify="center">
            <v-col cols="12" md="8">
              <h2 class="text-h4 font-weight-bold">Ready to Change the Conversation?</h2>
              <p class="text-body-1 text-grey-lighten-1 mt-4">Join the beta waitlist and be the first to know when we launch.</p>
              <div class="mt-8 d-flex flex-column flex-sm-row ga-4" style="max-width: 500px; margin: auto;">
                <v-text-field label="Enter your email" variant="solo" rounded hide-details></v-text-field>
                <v-btn type="submit" color="amber" size="x-large" class="text-grey-darken-4">Notify Me</v-btn>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-sheet>
  </v-container>
</template>
