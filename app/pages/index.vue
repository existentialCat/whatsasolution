<!-- pages/index.vue -->
<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <h1 class="text-h2 font-weight-bold mb-3">
          Welcome to What's a Solution
        </h1>
        <p class="text-h5">
          The Stack Overflow for political problems and solutions.
        </p>
      </v-col>
    </v-row>
    <v-row class="mt-8">
      <v-col cols="12">
        <v-card class="pa-5">
          <v-card-title class="text-h5">How It Works</v-card-title>
          <v-card-text>
            <p>
              Have you ever wondered what the best solution to a political problem is? Our platform allows you to submit real-world problems and propose solutions. The community can then upvote or downvote solutions, submit side effects, and comment on ideas.
            </p>
            <p class="mt-4">
              Our goal is to foster a community that works together to find the best possible solutions to our world's most pressing problems.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="mt-8">
      <v-col cols="12" md="6">
        <v-card class="pa-5">
          <v-card-title class="text-h5">Join the Conversation</v-card-title>
          <v-card-text>
            <p>
              Create an account to start submitting your own problems and solutions.
            </p>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" to="/login">Join Now</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-5">
          <v-card-title class="text-h5">Explore Solutions</v-card-title>
          <v-card-text>
            <p>
              Browse existing problems and see what solutions the community has proposed.
            </p>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" to="/problems">Explore</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
