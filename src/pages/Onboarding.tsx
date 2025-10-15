import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopicSelector from "@/components/TopicSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleComplete = async (topics: string[]) => {
    if (!user) return;

    try {
      // Insert user topics into database
      const userTopics = topics.map(topicId => ({
        user_id: user.id,
        topic_id: topicId,
      }));

      const { error } = await supabase
        .from('user_topics')
        .insert(userTopics);

      if (error) throw error;

      toast({
        title: "Topics saved!",
        description: "Your preferences have been updated.",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error saving topics",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <TopicSelector onComplete={handleComplete} />;
};

export default Onboarding;
