import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

interface AvailableTestsTabProps {
  studentId: string;
}

const AvailableTestsTab = ({ studentId }: AvailableTestsTabProps) => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, [studentId]);

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*, subjects(name), profiles(full_name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      toast.error("Failed to load available tests");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (assessmentId: string) => {
    navigate(`/test/${assessmentId}`);
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
        <h3 className="text-2xl font-semibold">Available Tests</h3>
        <p className="text-sm text-muted-foreground">Take published assessments to track your learning progress</p>
      </div>

      {assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No tests available</h3>
            <p className="text-sm text-muted-foreground">Your teacher hasn't published any assessments yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle>{assessment.title}</CardTitle>
                <CardDescription>
                  {assessment.subjects?.name} • By {assessment.profiles?.full_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Total Marks: {assessment.total_marks}</span>
                </div>
                <Button className="w-full" onClick={() => handleStartTest(assessment.id)}>
                  Start Test
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableTestsTab;
