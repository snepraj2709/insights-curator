import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Clock } from "lucide-react";

export interface Insight {
  id: string;
  topic: string;
  title: string;
  summary: string[];
  sources: { title: string; url: string }[];
  timestamp: string;
  topicColor: string;
}

interface InsightCardProps {
  insight: Insight;
}

const InsightCard = ({ insight }: InsightCardProps) => {
  return (
    <Card className="h-full flex flex-col shadow-card hover:shadow-elevated transition-all duration-300 border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-3">
          <Badge className={`${insight.topicColor} text-white`}>
            {insight.topic}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {insight.timestamp}
          </div>
        </div>
        <h3 className="text-xl font-bold text-foreground leading-tight">
          {insight.title}
        </h3>
      </div>

      {/* Summary Points */}
      <div className="flex-1 p-6 space-y-3">
        {insight.summary.map((point, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <p className="text-sm text-foreground/90 leading-relaxed">{point}</p>
          </div>
        ))}
      </div>

      {/* Sources */}
      <div className="p-6 pt-0 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Sources
        </p>
        {insight.sources.map((source, idx) => (
          <a
            key={idx}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors group"
          >
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="truncate">{source.title}</span>
          </a>
        ))}
      </div>
    </Card>
  );
};

export default InsightCard;
