import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { LiveTestMonitor } from "@/components/test/LiveTestMonitor";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LiveTestsTabProps {
  teacherId: string;
}

export const LiveTestsTab = ({ teacherId }: LiveTestsTabProps) => {
  const [liveAssessments, setLiveAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveAssessments();
  }, [teacherId]);

  const fetchLiveAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("teacher_id", teacherId)
        .eq("is_live", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLiveAssessments(data || []);
    } catch (error) {
      console.error("Error fetching live assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {liveAssessments.length === 0 ? (
        <Alert>
          <AlertDescription>
            No live tests available. Create an assessment with "Enable Live Timed Test" to monitor students in real-time.
          </AlertDescription>
        </Alert>
      ) : (
        liveAssessments.map((assessment) => (
          <LiveTestMonitor
            key={assessment.id}
            assessmentId={assessment.id}
            assessmentTitle={assessment.title}
          />
        ))
      )}
    </div>
  );
};
