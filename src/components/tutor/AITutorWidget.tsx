import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AITutorWidgetProps {
  studentName: string;
  averageScore: number;
  topRecommendation?: string;
}

const AITutorWidget = ({ studentName, averageScore, topRecommendation }: AITutorWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);

  const getMotivationalMessage = () => {
    if (averageScore >= 85) {
      return "Fantastic work! You're a star student. Ready for some challenges?";
    } else if (averageScore >= 60) {
      return "Great progress! Let's keep building on your skills together.";
    } else {
      return "Every expert was once a beginner. Let's learn together!";
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
          "transition-all duration-300",
          isExpanded && "rotate-180"
        )}
      >
        {isExpanded ? (
          <X className="h-6 w-6" />
        ) : (
          <Bot className="h-6 w-6" />
        )}
      </Button>

      {/* Expanded Widget */}
      {isExpanded && (
        <Card className="fixed bottom-24 right-6 z-50 w-80 shadow-xl border-primary/20 animate-in slide-in-from-bottom-4">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div>
                <p className="font-semibold">Study Buddy</p>
                <p className="text-xs text-muted-foreground font-normal">Your Personal AI Tutor</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {showGreeting && (
              <div className="bg-muted/50 rounded-lg p-3 relative">
                <button 
                  onClick={() => setShowGreeting(false)}
                  className="absolute top-1 right-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Hi {studentName}! 👋</p>
                    <p className="text-muted-foreground mt-1">{getMotivationalMessage()}</p>
                  </div>
                </div>
              </div>
            )}

            {topRecommendation && (
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Top Recommendation
                </p>
                <p className="text-sm">{topRecommendation}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your average score</span>
              <span className={cn(
                "font-semibold",
                averageScore >= 85 ? "text-green-600" :
                averageScore >= 60 ? "text-yellow-600" : "text-red-600"
              )}>
                {averageScore}%
              </span>
            </div>

            <Button variant="outline" className="w-full" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask a Question
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AITutorWidget;
