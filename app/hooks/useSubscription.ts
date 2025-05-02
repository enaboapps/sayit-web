import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useSubscription() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [bypassEnabled, setBypassEnabled] = useState<boolean>(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_status, bypass_subscription_check')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (profile) {
          // Check if the subscription bypass is enabled
          const bypass = !!profile.bypass_subscription_check;
          setBypassEnabled(bypass);
          
          if (bypass) {
            // If bypass is enabled, consider subscription as active
            setIsActive(true);
          } else {
            // Otherwise, check subscription status normally
            const status = profile.subscription_status;
            setIsActive(status === 'active' || status === 'trialing');
          }
        } else {
          setIsActive(false);
          setBypassEnabled(false);
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setIsActive(false);
        setBypassEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  return { isActive, loading, bypassEnabled };
} 