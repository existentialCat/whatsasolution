// composables/useAuthHandler.js
import { useSupabaseClient, useRouter } from '#imports';

export const useAuthHandler = () => {
    const supabase = useSupabaseClient();
    const router = useRouter();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error.message);
        } else {
            await router.push('/login');
        }
    };

    return { handleLogout };
}