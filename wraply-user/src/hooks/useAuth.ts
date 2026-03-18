import { useAuthStore } from "@/stores/authStore";

export function useAuth(){

  const token = useAuthStore((s)=>s.token);
  const user = useAuthStore((s)=>s.user);

  const isAuthenticated = !!token;

  return {
    token,
    user,
    isAuthenticated
  };

}