import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, Target, BookOpen, Clock, ChevronRight, 
  Loader2, Sparkles, Video, FileText, Zap
} from "lucide-react";
import { ContentRecommendation } from "@/hooks/useRecommendationEngine";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PracticeModal from "./PracticeModal";

interface ActionableFeedProps {
  recommendations: ContentRecommendation[];
}

const ActionableFeed = ({ recommendations }: ActionableFeedProps) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [practiceData, setPracticeData] = useState<any>(null);
  const [activeSLO, setActiveSLO] = useState<{ name: string; percentage: number } | null>(null);
  const { toast } = useToast();

  const getIcon = (contentType: "challenge" | "reinforcement" | "foundational") => {
    switch (contentType) {
      case "challenge": return <Rocket className="h-5 w-5" />;
      case "reinforcement": return <Target className="h-5 w-5" />;
      case "foundational": return <BookOpen className="h-5 w-5" />;
    }
  };

  const getActivityIcon = (activity: string) => {
    if (activity.toLowerCase().includes("video")) return <Video className="h-3 w-3" />;
    if (activity.toLowerCase().includes("worksheet") || activity.toLowerCase().includes("exercise")) return <FileText className="h-3 w-3" />;
    return <Zap className="h-3 w-3" />;
  };

  const getBadgeVariant = (contentType: "challenge" | "reinforcement" | "foundational") => {
    switch (contentType) {
      case "challenge": return "default";
      case "reinforcement": return "secondary";
      case "foundational": return "outline";
    }
  };

  const handleGeneratePractice = async (rec: ContentRecommendation) => {
    setLoadingId(rec.sloId);
    setActiveSLO({ name: rec.sloName, percentage: rec.masteryPercentage });

    try {
      const { data, error } = await supabase.functions.invoke('generate-practice', {
        body: {
          sloName: rec.sloName,
          masteryPercentage: rec.masteryPercentage,
          questionCount: 5
        }
      });

      if (error) throw error;

      setPracticeData(data);
    } catch (error) {
      console.error("Error generating practice:", error);
      toast({
        title: "Error",
        description: "Failed to generate practice questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingId(null);
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommended Next Steps
          </CardTitle>
          <CardDescription>Personalized learning path based on your performance</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          <p>Complete assessments to get personalized recommendations!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommended Next Steps
          </CardTitle>
          <CardDescription>Personalized learning path based on your performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.sloId}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    rec.contentType === "challenge" ? "bg-green-100 text-green-700" :
                    rec.contentType === "reinforcement" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {getIcon(rec.contentType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-sm truncate">{rec.sloName}</h4>
                      <Badge variant={getBadgeVariant(rec.contentType)} className="text-xs">
                        {rec.contentLabel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{rec.subjectName}</p>
                    <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {rec.activities.slice(0, 3).map((activity, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                        >
                          {getActivityIcon(activity)}
                          {activity}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rec.estimatedTime}
                        </span>
                        <span className={`font-medium ${
                          rec.masteryPercentage >= 85 ? "text-green-600" :
                          rec.masteryPercentage >= 60 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {rec.masteryPercentage}% mastery
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => handleGeneratePractice(rec)}
                  disabled={loadingId === rec.sloId}
                >
                  {loadingId === rec.sloId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Start <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <PracticeModal
        isOpen={!!practiceData}
        onClose={() => {
          setPracticeData(null);
          setActiveSLO(null);
        }}
        practiceData={practiceData}
        sloInfo={activeSLO}
      />
    </>
  );
};

export default ActionableFeed;
