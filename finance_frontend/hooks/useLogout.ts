import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export function useLogout() {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/sign-in');
        } catch (error) {
            console.error('Logout failed:', error);
            router.push('/sign-in');
        }
    };

    return { handleLogout };
}