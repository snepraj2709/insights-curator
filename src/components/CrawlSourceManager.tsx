import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2, RefreshCw, ExternalLink } from "lucide-react";

interface Topic {
  id: string;
  name: string;
  icon: string;
}

interface CrawlSource {
  id: string;
  url: string;
  topic_id: string;
  status: string;
  last_crawled_at: string | null;
  error_message: string | null;
  created_at: string;
}

export const CrawlSourceManager = () => {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [crawlSources, setCrawlSources] = useState<CrawlSource[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loadingSources, setLoadingSources] = useState(true);
  const [crawlingIds, setCrawlingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTopics();
    fetchCrawlSources();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('crawl_sources_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crawl_sources',
        },
        () => {
          fetchCrawlSources();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('id, name, icon')
      .order('name');

    if (error) {
      console.error('Error fetching topics:', error);
      return;
    }

    setTopics(data || []);
    if (data && data.length > 0) {
      setSelectedTopic(data[0].id);
    }
  };

  const fetchCrawlSources = async () => {
    const { data, error } = await supabase
      .from('crawl_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching crawl sources:', error);
      toast({
        title: "Error",
        description: "Failed to load crawl sources",
        variant: "destructive",
      });
      return;
    }

    setCrawlSources(data || []);
    setLoadingSources(false);
  };

  const addCrawlSource = async () => {
    if (!newUrl || !selectedTopic) {
      toast({
        title: "Error",
        description: "Please enter a URL and select a topic",
        variant: "destructive",
      });
      return;
    }

    // Validate URL
    try {
      new URL(newUrl);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      setIsAdding(false);
      return;
    }

    const { error } = await supabase
      .from('crawl_sources')
      .insert({
        url: newUrl,
        topic_id: selectedTopic,
        user_id: user.id,
      });

    if (error) {
      console.error('Error adding crawl source:', error);
      toast({
        title: "Error",
        description: error.message.includes('duplicate') 
          ? "This URL is already added for this topic" 
          : "Failed to add crawl source",
        variant: "destructive",
      });
      setIsAdding(false);
      return;
    }

    toast({
      title: "Success",
      description: "Crawl source added successfully",
    });

    setNewUrl("");
    fetchCrawlSources();
    setIsAdding(false);
  };

  const deleteCrawlSource = async (id: string) => {
    const { error } = await supabase
      .from('crawl_sources')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting crawl source:', error);
      toast({
        title: "Error",
        description: "Failed to delete crawl source",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Crawl source deleted",
    });

    fetchCrawlSources();
  };

  const triggerCrawl = async (id: string) => {
    setCrawlingIds(prev => new Set(prev).add(id));

    const { error } = await supabase.functions.invoke('crawl-and-curate', {
      body: { crawl_source_id: id },
    });

    if (error) {
      console.error('Error triggering crawl:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start crawl",
        variant: "destructive",
      });
      setCrawlingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    toast({
      title: "Crawl Started",
      description: "Processing website content...",
    });
  };

  useEffect(() => {
    // Clean up crawlingIds when sources are no longer crawling
    setCrawlingIds(prev => {
      const next = new Set(prev);
      crawlSources.forEach(source => {
        if (source.status !== 'crawling' && next.has(source.id)) {
          next.delete(source.id);
        }
      });
      return next;
    });
  }, [crawlSources]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'crawling': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loadingSources) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Website to Crawl</h3>
        <div className="flex gap-3">
          <Input
            type="url"
            placeholder="https://example.com"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1"
          />
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.icon} {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addCrawlSource} disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Crawl Sources ({crawlSources.length})</h3>
        {crawlSources.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            No crawl sources added yet. Add your first website above!
          </Card>
        ) : (
          crawlSources.map((source) => {
            const topic = topics.find(t => t.id === source.topic_id);
            const isCrawling = source.status === 'crawling' || crawlingIds.has(source.id);
            
            return (
              <Card key={source.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium hover:underline flex items-center gap-1 truncate"
                      >
                        {source.url}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{topic?.icon} {topic?.name}</span>
                      <span className={getStatusColor(source.status)}>
                        {source.status}
                      </span>
                      {source.last_crawled_at && (
                        <span>
                          Last crawled: {new Date(source.last_crawled_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {source.error_message && (
                      <p className="text-sm text-red-600 mt-1">{source.error_message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerCrawl(source.id)}
                      disabled={isCrawling}
                    >
                      {isCrawling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteCrawlSource(source.id)}
                      disabled={isCrawling}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};