import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "@/components/Dashboard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrawlSourceManager } from "@/components/CrawlSourceManager";

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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Tabs defaultValue="insights" className="w-full">
        <div className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <TabsList className="h-14">
              <TabsTrigger value="insights" className="text-base">Insights</TabsTrigger>
              <TabsTrigger value="sources" className="text-base">Crawl Sources</TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <TabsContent value="insights" className="m-0">
          <Dashboard selectedTopics={selectedTopics} />
        </TabsContent>
        
        <TabsContent value="sources" className="m-0">
          <div className="container mx-auto px-4 py-8">
            <CrawlSourceManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
