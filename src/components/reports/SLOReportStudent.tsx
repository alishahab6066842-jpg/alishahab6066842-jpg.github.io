import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SLOReportStudentProps {
  studentId: string;
}

const SLOReportStudent = ({ studentId }: SLOReportStudentProps) => {
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<any[]>([]);

  useEffect(() => {
    fetchPerformance();
  }, [studentId]);

  const fetchPerformance = async () => {
    try {
      const { data, error } = await supabase
        .from("slo_performance")
        .select("*, slos(description, subjects(name))")
        .eq("student_id", studentId)
        .order("last_updated", { ascending: false });

      if (error) throw error;
      setPerformance(data || []);
    } catch (error) {
      console.error("Error fetching performance:", error);
      toast.error("Failed to load SLO report");
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "mastery":
        return "default";
      case "satisfactory":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getLevelLabel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (performance.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No performance data yet. Take some tests to see your progress!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-semibold">My SLO Proficiency Report</h3>
        <p className="text-sm text-muted-foreground">Track your mastery of learning outcomes</p>
      </div>

      <div className="grid gap-4">
        {performance.map((perf) => (
          <Card key={perf.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{perf.slos?.description}</CardTitle>
                  <CardDescription>{perf.slos?.subjects?.name}</CardDescription>
                </div>
                <Badge variant={getLevelColor(perf.current_level)}>{getLevelLabel(perf.current_level)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Proficiency</span>
                <span className="font-medium">{perf.current_proficiency_percentage.toFixed(1)}%</span>
              </div>
              <Progress value={perf.current_proficiency_percentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {perf.total_marks_earned.toFixed(1)} / {perf.total_marks_attempted.toFixed(1)} marks
                </span>
                <span>Last updated: {new Date(perf.last_updated).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SLOReportStudent;
