import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SLOReportTeacherProps {
  teacherId: string;
}

const SLOReportTeacher = ({ teacherId }: SLOReportTeacherProps) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [performance, setPerformance] = useState<any[]>([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchPerformance(selectedStudent);
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      const { data: attempts } = await supabase
        .from("test_attempts")
        .select("student_id, profiles(full_name)")
        .eq("assessment_id", (await supabase.from("assessments").select("id").eq("teacher_id", teacherId).limit(1).single()).data?.id || "");

      const uniqueStudents = Array.from(
        new Map(attempts?.map((a: any) => [a.student_id, { id: a.student_id, name: a.profiles?.full_name }])).values()
      );

      const { data: allStudents } = await supabase.from("profiles").select("id, full_name").eq("role", "student");

      setStudents(allStudents || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching students:", error);
      setLoading(false);
    }
  };

  const fetchPerformance = async (studentId: string) => {
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
      toast.error("Failed to load student performance");
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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-semibold">Student SLO Reports</h3>
        <p className="text-sm text-muted-foreground">View individual student performance on learning outcomes</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Select Student</label>
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedStudent && performance.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">This student hasn't taken any tests yet.</p>
          </CardContent>
        </Card>
      )}

      {selectedStudent && performance.length > 0 && (
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
      )}
    </div>
  );
};

export default SLOReportTeacher;
