// composables/useScrollAndHighlight.js
import { nextTick } from 'vue';
import { useRoute } from 'vue-router';

export function useScrollAndHighlight() {
  const route = useRoute();

  const trigger = async () => {
    const hash = route.hash;
    // Do nothing if there's no hash in the URL
    if (!hash) return;

    // Wait for the initial DOM update cycle to complete
    await nextTick();

    let attempts = 0;
    const maxAttempts = 15; // Try for up to 1.5 seconds
    const interval = 100;   // every 100ms

    const tryToFindElement = () => {
      // The hash includes '#', which is a valid selector for querySelector
      const element = document.querySelector(hash);

      if (element) {
        // If we find the element, scroll to it and apply the animation
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('flash-animation');
        setTimeout(() => {
          element.classList.remove('flash-animation');
        }, 2000); // Animation duration
      } else if (attempts < maxAttempts) {
        // If not found, increment attempts and try again after a delay
        attempts++;
        setTimeout(tryToFindElement, interval);
      } else {
        // If we still can't find it, log a warning
        console.warn(`[useScrollAndHighlight] Could not find element with selector: ${hash} after ${maxAttempts} attempts.`);
      }
    };

    // Start the process
    tryToFindElement();
  };

  return { trigger };
}