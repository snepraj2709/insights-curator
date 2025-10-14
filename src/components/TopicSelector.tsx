import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TOPICS = [
  { id: "ai", name: "Artificial Intelligence", icon: "🤖", color: "from-violet-500 to-purple-500" },
  { id: "startups", name: "Startups & VC", icon: "🚀", color: "from-blue-500 to-cyan-500" },
  { id: "marketing", name: "Marketing & Growth", icon: "📈", color: "from-green-500 to-emerald-500" },
  { id: "finance", name: "Finance & Markets", icon: "💰", color: "from-yellow-500 to-orange-500" },
  { id: "health", name: "Health & Wellness", icon: "❤️", color: "from-red-500 to-pink-500" },
  { id: "tech", name: "Technology", icon: "💻", color: "from-indigo-500 to-blue-500" },
  { id: "science", name: "Science & Research", icon: "🔬", color: "from-teal-500 to-cyan-500" },
  { id: "productivity", name: "Productivity", icon: "⚡", color: "from-amber-500 to-yellow-500" },
];

interface TopicSelectorProps {
  onComplete: (topics: string[]) => void;
}

const TopicSelector = ({ onComplete }: TopicSelectorProps) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Choose Your Topics
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the topics you care about. We'll curate daily insights from trusted sources in these areas.
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected (minimum 1)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {TOPICS.map((topic) => (
            <Card
              key={topic.id}
              onClick={() => toggleTopic(topic.id)}
              className={cn(
                "relative cursor-pointer transition-all duration-300 hover:shadow-elevated hover:scale-105 p-6 border-2",
                selectedTopics.includes(topic.id)
                  ? "border-primary bg-primary/5 shadow-card"
                  : "border-border hover:border-primary/50"
              )}
            >
              {selectedTopics.includes(topic.id) && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              <div className="space-y-3">
                <div className={cn("text-4xl bg-gradient-to-br p-3 rounded-xl inline-block", topic.color)}>
                  {topic.icon}
                </div>
                <h3 className="font-semibold text-lg text-foreground">{topic.name}</h3>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => onComplete(selectedTopics)}
            disabled={selectedTopics.length === 0}
            className="px-12 py-6 text-lg shadow-elevated"
          >
            Continue to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopicSelector;
