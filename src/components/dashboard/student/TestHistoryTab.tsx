import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Loader2, Trophy, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface TestHistoryTabProps {
  studentId: string;
}

const TestHistoryTab = ({ studentId }: TestHistoryTabProps) => {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttempts();
  }, [studentId]);

  const fetchAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from("test_attempts")
        .select("*, assessments(title, total_marks, subjects(name))")
        .eq("student_id", studentId)
        .order("submission_date", { ascending: false });

      if (error) throw error;
      setAttempts(data || []);
    } catch (error) {
      console.error("Error fetching test history:", error);
      toast.error("Failed to load test history");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 85) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreIcon = (percentage: number) => {
    if (percentage >= 85) return <Trophy className="h-4 w-4" />;
    if (percentage >= 60) return <CheckCircle2 className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 85) return { label: "Mastery", variant: "default" as const };
    if (percentage >= 60) return { label: "Satisfactory", variant: "secondary" as const };
    return { label: "Developmental", variant: "destructive" as const };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-semibold">My Test Results</h3>
        <p className="text-sm text-muted-foreground">View your assessment history and performance</p>
      </div>

      {attempts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No test history</h3>
            <p className="text-sm text-muted-foreground">You haven't taken any tests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const percentage = (attempt.raw_score / attempt.total_possible) * 100;
            const badge = getScoreBadge(percentage);

            return (
              <Card key={attempt.id} className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{attempt.assessments?.title}</CardTitle>
                      <CardDescription>{attempt.assessments?.subjects?.name}</CardDescription>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={getScoreColor(percentage)}>{getScoreIcon(percentage)}</div>
                      <span className="text-2xl font-bold">
                        {attempt.raw_score}/{attempt.total_possible}
                      </span>
                      <span className={`text-sm ${getScoreColor(percentage)}`}>({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Submitted on</p>
                      <p>{new Date(attempt.submission_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {attempt.slo_breakdown && Array.isArray(attempt.slo_breakdown) && attempt.slo_breakdown.length > 0 && (
                    <div className="mt-4 space-y-2 rounded-lg border bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground">SLO Performance Breakdown</p>
                      <div className="space-y-1">
                        {attempt.slo_breakdown.map((slo: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">SLO {idx + 1}</span>
                            <span className="font-medium">
                              {slo.marksEarned || 0}/{slo.marksAttempted || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TestHistoryTab;
