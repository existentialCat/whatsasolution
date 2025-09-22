import { watch, onMounted, ref, computed } from 'vue';
import { useState, useHead } from '#imports';

export function useFaviconNotifier() {
  if (process.server) return;
  
  const notifications = useState('notifications', () => []);
  const originalFaviconHref = ref(null);

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.is_read).length;
  });

  const setFavicon = (href) => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  };
  
  const drawFavicon = async (count) => {
    if (!originalFaviconHref.value) return;

    // ✅ FETCH THE SVG CONTENT AS TEXT
    const svgText = await fetch(originalFaviconHref.value).then(res => res.text());
    
    // ✅ CREATE A STABLE IMAGE SOURCE FROM THE SVG TEXT
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.width = 32;
    img.height = 32;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0, 32, 32);
      URL.revokeObjectURL(url); // Clean up the blob URL

      ctx.beginPath();
      ctx.arc(22, 10, 9, 0, 2 * Math.PI);
      ctx.fillStyle = '#FF0000';
      ctx.fill();
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const countText = count > 9 ? '9+' : count.toString();
      ctx.fillText(countText, 22, 11);

      setFavicon(canvas.toDataURL('image/png'));
    };
    
    img.src = url;
  };
  
  onMounted(() => {
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      originalFaviconHref.value = link.href;
    }
  });
  
  watch(unreadCount, (newCount) => {
    if (!originalFaviconHref.value) return;

    if (newCount > 0) {
      drawFavicon(newCount);
    } else {
      setFavicon(originalFaviconHref.value);
    }
  }, { immediate: true });
}