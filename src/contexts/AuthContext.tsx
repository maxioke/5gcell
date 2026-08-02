import {
    createContext,
    useContext,
    useEffect,
    useState,
  } from "react";
  
  import type { ReactNode } from "react";
  import type { User } from "@supabase/supabase-js";
  import { supabase } from "../lib/supabase";
  
  type Profile = {
    id: string;
    business_name: string;
    owner_name: string;
    phone: string | null;
  };
  
  type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
  };
  
  const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => {},
  });
  
  export function AuthProvider({
    children,
  }: {
    children: ReactNode;
  }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
  
    async function loadProfile(userId: string) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
  
      if (!error && data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    }
  
    async function signOut() {
      await supabase.auth.signOut();
      setProfile(null);
      setUser(null);
    }
  
    useEffect(() => {
      async function loadSession() {
        const {
          data: { session },
        } = await supabase.auth.getSession();
  
        const currentUser = session?.user ?? null;
  
        setUser(currentUser);
  
        if (currentUser) {
          await loadProfile(currentUser.id);
        }
  
        setLoading(false);
      }
  
      loadSession();
  
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const currentUser = session?.user ?? null;
  
        setUser(currentUser);
  
        if (currentUser) {
          await loadProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      });
  
      return () => {
        subscription.unsubscribe();
      };
    }, []);
  
    return (
      <AuthContext.Provider
        value={{
          user,
          profile,
          loading,
          signOut,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }
  
  export function useAuth() {
    return useContext(AuthContext);
  }