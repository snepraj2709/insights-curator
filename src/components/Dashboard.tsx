import { useState } from "react";
import InsightCard, { Insight } from "./InsightCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Menu, User } from "lucide-react";

// Mock data
const MOCK_INSIGHTS: Insight[] = [
  {
    id: "1",
    topic: "Artificial Intelligence",
    title: "OpenAI Announces GPT-5 with Enhanced Reasoning Capabilities",
    summary: [
      "GPT-5 shows 40% improvement in complex reasoning tasks compared to GPT-4",
      "New model features built-in fact-checking and source attribution",
      "Early access available to enterprise customers starting Q2 2025"
    ],
    sources: [
      { title: "OpenAI Blog", url: "https://openai.com" },
      { title: "TechCrunch Coverage", url: "https://techcrunch.com" }
    ],
    timestamp: "2 hours ago",
    topicColor: "bg-gradient-to-r from-violet-500 to-purple-500"
  },
  {
    id: "2",
    topic: "Startups & VC",
    title: "AI Infrastructure Startups Raise Record $12B in Q1",
    summary: [
      "Venture funding for AI infrastructure companies reaches all-time high",
      "Focus shifts from foundation models to specialized tooling and optimization",
      "Notable raises include CoreWeave ($2.3B) and Together AI ($1.2B)"
    ],
    sources: [
      { title: "Crunchbase News", url: "https://crunchbase.com" },
      { title: "The Information", url: "https://theinformation.com" }
    ],
    timestamp: "4 hours ago",
    topicColor: "bg-gradient-to-r from-blue-500 to-cyan-500"
  },
  {
    id: "3",
    topic: "Marketing & Growth",
    title: "LinkedIn Algorithm Update Prioritizes Authentic Engagement",
    summary: [
      "New algorithm reduces reach of engagement bait and clickbait content",
      "Posts with genuine conversations see 3x higher distribution",
      "Video content now prioritized in feeds, especially under 90 seconds"
    ],
    sources: [
      { title: "LinkedIn Engineering", url: "https://linkedin.com" },
      { title: "Social Media Today", url: "https://socialmediatoday.com" }
    ],
    timestamp: "6 hours ago",
    topicColor: "bg-gradient-to-r from-green-500 to-emerald-500"
  },
  {
    id: "4",
    topic: "Technology",
    title: "Apple Vision Pro 2 Leaked with Major Battery Improvements",
    summary: [
      "Second-gen headset rumored to feature 6-hour battery life (up from 2 hours)",
      "Lighter design with 30% weight reduction targeting broader consumer appeal",
      "Expected launch in late 2025 with $2,500 starting price"
    ],
    sources: [
      { title: "Bloomberg", url: "https://bloomberg.com" },
      { title: "The Verge", url: "https://theverge.com" }
    ],
    timestamp: "8 hours ago",
    topicColor: "bg-gradient-to-r from-indigo-500 to-blue-500"
  }
];

interface DashboardProps {
  selectedTopics: string[];
}

const Dashboard = ({ selectedTopics }: DashboardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextInsight = () => {
    setCurrentIndex((prev) => (prev + 1) % MOCK_INSIGHTS.length);
  };

  const prevInsight = () => {
    setCurrentIndex((prev) => (prev - 1 + MOCK_INSIGHTS.length) % MOCK_INSIGHTS.length);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">IF</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">InsightFlow</h1>
                <p className="text-xs text-muted-foreground">Daily Intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Today</span>
              </Button>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Today's Insights
          </h2>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={prevInsight}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 hidden lg:flex z-10 shadow-elevated bg-background hover:bg-secondary"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={nextInsight}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 hidden lg:flex z-10 shadow-elevated bg-background hover:bg-secondary"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Card Display */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {MOCK_INSIGHTS.map((insight) => (
                <div key={insight.id} className="w-full flex-shrink-0 px-2">
                  <InsightCard insight={insight} />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex lg:hidden gap-4 justify-center mt-6">
            <Button variant="outline" size="icon" onClick={prevInsight}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextInsight}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {MOCK_INSIGHTS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? "bg-primary w-8" 
                    : "bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-background rounded-xl shadow-card border border-border">
            <div className="text-3xl font-bold text-primary mb-2">{MOCK_INSIGHTS.length}</div>
            <div className="text-sm text-muted-foreground">Insights Today</div>
          </div>
          <div className="text-center p-6 bg-background rounded-xl shadow-card border border-border">
            <div className="text-3xl font-bold text-primary mb-2">{selectedTopics.length}</div>
            <div className="text-sm text-muted-foreground">Topics Tracked</div>
          </div>
          <div className="text-center p-6 bg-background rounded-xl shadow-card border border-border">
            <div className="text-3xl font-bold text-primary mb-2">2.3h</div>
            <div className="text-sm text-muted-foreground">Time Saved</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
