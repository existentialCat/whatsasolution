// composables/usePermissions.js
import { useSupabaseUser } from '#imports';

export function usePermissions() {
  const user = useSupabaseUser();

  const isOwner = (content) => {
    // Check if user is logged in and the content object exists
    return user.value && content && user.value.id === content.submitted_by;
  };

  const canEdit = (content) => {
    if (!content?.created_at) return false;
    const tenMinutes = 10 * 60 * 1000;
    return new Date() - new Date(content.created_at) < tenMinutes;
  };

  return { isOwner, canEdit };
}