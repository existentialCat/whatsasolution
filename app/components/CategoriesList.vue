<template>
  <v-card>
    <div v-if="props.isSticky && !props.isExpandedWhileSticky">
      <v-list-item
        class="text-center pa-2"
        title="Categories"
        @click="$emit('toggleExpansion')"
        style="cursor: pointer;"
      >
        <template v-slot:prepend>
          <v-icon>mdi-filter-variant</v-icon>
        </template>
        <template v-slot:append>
          <v-icon>mdi-chevron-down</v-icon>
        </template>
      </v-list-item>
    </div>

    <div v-else>
      <v-card-title class="text-h6 font-weight-medium d-flex justify-space-between align-center">
        Categories
        <v-btn
          v-if="props.isSticky && props.isExpandedWhileSticky"
          icon="mdi-chevron-up"
          variant="text"
          size="small"
          @click="$emit('toggleExpansion')"
        ></v-btn>
      </v-card-title>
      <v-divider></v-divider>
      
      <v-list
        density="compact"
        nav
        :style="dynamicListStyle"
      >
        <v-list-item
          prepend-icon="mdi-format-list-bulleted"
          :title="`All Problems (${props.counts.all || 0})`"
          :active="selectedCategory === null"
          @click="selectCategory(null)"
          class="mb-2"
        ></v-list-item>

        <template v-for="(subcategories, parentCategory) in categories" :key="parentCategory">
          <v-list-subheader class="font-weight-bold text-uppercase">{{ parentCategory }}</v-list-subheader>
          <v-list-item
            v-for="subcategory in subcategories"
            :key="subcategory.key"
            :value="subcategory.key"
            :active="selectedCategory === subcategory.key"
            @click="selectCategory(subcategory.key)"
            :title="`${subcategory.title} (${props.counts[subcategory.key] || 0})`"
          >
            <template v-slot:prepend>
               <v-icon size="x-small" icon="mdi-tag-outline"></v-icon>
            </template>
          </v-list-item>
        </template>
      </v-list>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  counts: { type: Object, required: true, default: () => ({ all: 0 }) },
});

const emits = defineEmits(['category-selected']);
const selectedCategory = ref(null);

const categories = {
  'Environment': [
    { key: 'climate-change', title: 'Climate Change' },
    { key: 'pollution', title: 'Pollution' },
    { key: 'biodiversity-loss', title: 'Biodiversity Loss' },
    { key: 'resource-scarcity', title: 'Resource Scarcity' }
  ],
  'Social & Economic': [
    { key: 'poverty-hunger', title: 'Poverty & Hunger' },
    { key: 'inequality', title: 'Inequality' },
    { key: 'public-health', title: 'Public Health' },
    { key: 'education-access', title: 'Education Access' }
  ],
  'Politics & Governance': [
    { key: 'war-conflict', title: 'War & Conflict' },
    { key: 'human-rights', title: 'Human Rights' },
    { key: 'corruption-instability', title: 'Corruption & Instability' },
    { key: 'misinformation', title: 'Misinformation' }
  ],
  'Technology': [
    { key: 'ai-ethics', title: 'AI & Ethics' },
    { key: 'cybersecurity', title: 'Cybersecurity' },
    { key: 'digital-divide', title: 'Digital Divide' },
    { key: 'automation-jobs', title: 'Automation & Jobs' }
  ],
  'Crime & Justice': [
    { key: 'organized-crime', title: 'Organized Crime' },
    { key: 'violent-crime', title: 'Violent Crime' },
    { key: 'property-crime', title: 'Property Crime' },
    { key: 'cybercrime', title: 'Cybercrime' }
  ],
  'Other': [
    { key: 'immigration', title: 'Immigration' }
  ]
};

const selectCategory = (categoryKey) => {
  selectedCategory.value = categoryKey;
  emits('category-selected', categoryKey);
};
</script>

<style scoped>
.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
.v-list-subheader {
    margin-top: 8px;
    font-size: 0.75rem;
    color: rgba(0,0,0,0.6);
}
</style>