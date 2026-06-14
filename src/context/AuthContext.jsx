import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from '../components/shared/Toast';

export const AuthContext = createContext(null);

const ROLE_HOME = {
  customer: '/home',
  store_owner: '/store/dashboard',
  delivery_partner: '/delivery/dashboard',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /** Fetch profile from DB after session established. */
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err) {
      console.error('fetchProfile error:', err);
      setProfile(null);
      return null;
    }
  }, []);

  /** Listen for auth state changes (login, logout, refresh). */
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }

      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, navigate]);

  /**
   * Login with email + password.
   * Verifies the selected role matches the profile role.
   */
  const login = useCallback(
    async (email, password, selectedRole) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const prof = await fetchProfile(data.user.id);
        if (!prof) throw new Error('Profile not found. Please contact support.');

        // Map UI role labels to DB enum values
        const roleMap = {
          customer: 'customer',
          store: 'store_owner',
          delivery: 'delivery_partner',
        };
        const expectedRole = roleMap[selectedRole] || selectedRole;

        if (prof.role !== expectedRole) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          throw new Error(
            `Wrong role selected. This account is registered as "${prof.role.replace('_', ' ')}".`
          );
        }

        toast.success(`Welcome back, ${prof.full_name}!`);
        navigate(ROLE_HOME[prof.role] || '/');
        return { user: data.user, profile: prof };
      } catch (err) {
        toast.error(err.message || 'Login failed. Please try again.');
        throw err;
      }
    },
    [fetchProfile, navigate]
  );

  /**
   * Register a new user.
   * Creates auth user, then profile, then store/delivery profile if applicable.
   */
  const register = useCallback(
    async (userData, selectedRole) => {
      const roleMap = {
        customer: 'customer',
        store: 'store_owner',
        delivery: 'delivery_partner',
      };
      const role = roleMap[selectedRole] || 'customer';

      try {
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              full_name: userData.fullName,
              phone: userData.phone || null,
              role,
            },
          },
        });
        if (error) throw error;
        if (!data.user) throw new Error('Registration failed. Please try again.');

        // If the user session is immediately available (email confirmation disabled)
        if (data.session) {
          // Use update instead of upsert to avoid requiring INSERT RLS policy on profiles,
          // since the database trigger handle_new_user already inserts the profile row.
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({
              full_name: userData.fullName,
              phone: userData.phone || null,
            })
            .eq('id', data.user.id);
          if (profileErr) console.warn('Profile details sync warning:', profileErr);

          // Create store record for store owners
          if (role === 'store_owner' && userData.storeName) {
            const { error: storeErr } = await supabase.from('stores').insert([
              {
                owner_id: data.user.id,
                name: userData.storeName,
                address: userData.storeAddress || 'TBD',
                city: userData.city || 'Delhi',
                pincode: userData.pincode || '110001',
                lat: userData.lat || 28.6139,
                lng: userData.lng || 77.209,
              },
            ]);
            if (storeErr) console.warn('Store creation warning:', storeErr);
          }
        }

        toast.success('Account created! Please check your email to confirm.');
        navigate('/login');
        return data.user;
      } catch (err) {
        toast.error(err.message || 'Registration failed. Please try again.');
        throw err;
      }
    },
    [navigate]
  );

  /** Sign out. */
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      navigate('/login');
    } catch (err) {
      toast.error('Logout failed.');
    }
  }, [navigate]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
