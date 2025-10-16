-- Create enum for crawl status
CREATE TYPE public.crawl_status AS ENUM ('pending', 'crawling', 'completed', 'failed');

-- Create table to track websites to crawl
CREATE TABLE public.crawl_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status crawl_status NOT NULL DEFAULT 'pending',
  last_crawled_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(url, topic_id)
);

-- Enable RLS
ALTER TABLE public.crawl_sources ENABLE ROW LEVEL SECURITY;

-- Policies for crawl_sources
CREATE POLICY "Users can view their own crawl sources"
  ON public.crawl_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crawl sources"
  ON public.crawl_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crawl sources"
  ON public.crawl_sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own crawl sources"
  ON public.crawl_sources FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all crawl sources
CREATE POLICY "Admins can view all crawl sources"
  ON public.crawl_sources FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all crawl sources (for crawler function)
CREATE POLICY "Admins can update all crawl sources"
  ON public.crawl_sources FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_crawl_sources_updated_at
  BEFORE UPDATE ON public.crawl_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();