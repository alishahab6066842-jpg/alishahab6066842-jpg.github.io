import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import CreateAssessmentDialog from "@/components/assessment/CreateAssessmentDialog";

interface AssessmentsTabProps {
  teacherId: string;
}

const AssessmentsTab = ({ teacherId }: AssessmentsTabProps) => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [teacherId]);

  const fetchData = async () => {
    try {
      const [subjectsRes, assessmentsRes] = await Promise.all([
        supabase.from("subjects").select("*").eq("teacher_id", teacherId),
        supabase
          .from("assessments")
          .select("*, subjects(name)")
          .eq("teacher_id", teacherId)
          .order("created_at", { ascending: false }),
      ]);

      if (subjectsRes.error) throw subjectsRes.error;
      if (assessmentsRes.error) throw assessmentsRes.error;

      setSubjects(subjectsRes.data || []);
      setAssessments(assessmentsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">Assessments</h3>
          <p className="text-sm text-muted-foreground">Create and manage your assessments</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={subjects.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          New Assessment
        </Button>
      </div>

      <CreateAssessmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        subjects={subjects}
        teacherId={teacherId}
        onSuccess={fetchData}
      />

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Create a subject first</h3>
            <p className="text-sm text-muted-foreground">You need to create at least one subject before creating assessments</p>
          </CardContent>
        </Card>
      ) : assessments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No assessments yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">Create your first assessment to start testing students</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <Badge variant={assessment.is_published ? "default" : "secondary"}>
                    {assessment.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <CardTitle>{assessment.title}</CardTitle>
                <CardDescription>{assessment.subjects?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Marks: {assessment.total_marks}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(assessment.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssessmentsTab;
