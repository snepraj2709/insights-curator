import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "@/components/Dashboard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    const fetchUserTopics = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_topics')
          .select('topic_id')
          .eq('user_id', user.id);

        if (error) throw error;

        const topics = data?.map(item => item.topic_id) || [];
        
        if (topics.length === 0) {
          navigate('/onboarding');
        } else {
          setSelectedTopics(topics);
        }
      } catch (error) {
        console.error('Error fetching topics:', error);
      } finally {
        setLoadingTopics(false);
      }
    };

    if (user) {
      fetchUserTopics();
    }
  }, [user, loading, navigate]);

  if (loading || loadingTopics) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (selectedTopics.length === 0) {
    return null;
  }

  return <Dashboard selectedTopics={selectedTopics} />;
};

export default DashboardPage;
