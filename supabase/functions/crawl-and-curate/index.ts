import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { crawl_source_id } = await req.json();

    // Get the crawl source
    const { data: crawlSource, error: fetchError } = await supabase
      .from('crawl_sources')
      .select('*')
      .eq('id', crawl_source_id)
      .single();

    if (fetchError || !crawlSource) {
      console.error('Error fetching crawl source:', fetchError);
      throw new Error('Crawl source not found');
    }

    console.log(`Starting crawl for ${crawlSource.url}`);

    // Update status to crawling
    await supabase
      .from('crawl_sources')
      .update({ status: 'crawling' })
      .eq('id', crawl_source_id);

    // Fetch the website content
    const websiteResponse = await fetch(crawlSource.url);
    if (!websiteResponse.ok) {
      throw new Error(`Failed to fetch website: ${websiteResponse.statusText}`);
    }

    const htmlContent = await websiteResponse.text();
    
    // Extract text content (basic extraction, removing HTML tags)
    const textContent = htmlContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000); // Limit to 8000 chars to fit in context

    console.log('Website content extracted, length:', textContent.length);

    // Get topic info
    const { data: topic } = await supabase
      .from('topics')
      .select('name, description')
      .eq('id', crawlSource.topic_id)
      .single();

    // Use Lovable AI to curate insights
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an AI curator that extracts insights from web content. Your task is to analyze content and create concise, valuable insights related to "${topic?.name || crawlSource.topic_id}".`
          },
          {
            role: "user",
            content: `Analyze this content from ${crawlSource.url} and extract 1-2 key insights related to ${topic?.name || crawlSource.topic_id}.
            
Content:
${textContent}

Provide your response in this JSON format:
{
  "insights": [
    {
      "title": "Brief title (max 80 chars)",
      "summary": "Concise summary of the insight (max 300 chars)"
    }
  ]
}

Only include truly valuable, actionable insights. If the content is not relevant or doesn't contain useful insights, return an empty insights array.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (aiResponse.status === 402) {
        throw new Error("Payment required. Please add credits to your workspace.");
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("Failed to generate insights with AI");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received from AI");
    }

    console.log('AI response received:', content);

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedResponse = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse AI response');
    }

    // Insert insights into database
    const insights = parsedResponse.insights || [];
    console.log(`Creating ${insights.length} insights`);

    for (const insight of insights) {
      const { error: insertError } = await supabase
        .from('insights')
        .insert({
          topic_id: crawlSource.topic_id,
          title: insight.title,
          summary: insight.summary,
          source_links: [{ url: crawlSource.url, title: new URL(crawlSource.url).hostname }],
          date: new Date().toISOString().split('T')[0],
        });

      if (insertError) {
        console.error('Error inserting insight:', insertError);
      }
    }

    // Update crawl source status
    await supabase
      .from('crawl_sources')
      .update({
        status: 'completed',
        last_crawled_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', crawl_source_id);

    console.log('Crawl completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        insights_created: insights.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in crawl-and-curate:', error);

    // Try to update status to failed if we have the crawl_source_id
    try {
      const { crawl_source_id } = await req.json();
      if (crawl_source_id) {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          
          await supabase
            .from('crawl_sources')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', crawl_source_id);
        }
      }
    } catch (updateError) {
      console.error('Error updating failed status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});