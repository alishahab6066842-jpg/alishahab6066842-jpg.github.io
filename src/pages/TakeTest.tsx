import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const TakeTest = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [studentId, setStudentId] = useState<string>("");

  useEffect(() => {
    fetchTestData();
  }, [assessmentId]);

  const fetchTestData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setStudentId(user.id);

      const [assessmentRes, questionsRes] = await Promise.all([
        supabase.from("assessments").select("*, subjects(name)").eq("id", assessmentId).single(),
        supabase.from("questions").select("*").eq("assessment_id", assessmentId).order("order_number"),
      ]);

      if (assessmentRes.error) throw assessmentRes.error;
      if (questionsRes.error) throw questionsRes.error;

      setAssessment(assessmentRes.data);
      setQuestions(questionsRes.data);
    } catch (error) {
      console.error("Error fetching test:", error);
      toast.error("Failed to load test");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    setSubmitting(true);
    try {
      let totalScore = 0;
      const sloScores: Record<string, { earned: number; possible: number }> = {};

      for (const question of questions) {
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
        const earnedMarks = isCorrect ? question.max_marks : 0;
        totalScore += earnedMarks;

        const { data: mappings } = await supabase
          .from("question_slo_mappings")
          .select("slo_id, mark_contribution")
          .eq("question_id", question.id);

        for (const mapping of mappings || []) {
          if (!sloScores[mapping.slo_id]) {
            sloScores[mapping.slo_id] = { earned: 0, possible: 0 };
          }
          const proportion = mapping.mark_contribution / question.max_marks;
          sloScores[mapping.slo_id].earned += earnedMarks * proportion;
          sloScores[mapping.slo_id].possible += mapping.mark_contribution;
        }
      }

      const { error: attemptError } = await supabase.from("test_attempts").insert({
        student_id: studentId,
        assessment_id: assessmentId,
        answers: answers,
        raw_score: totalScore,
        total_possible: assessment.total_marks,
        slo_breakdown: sloScores,
      });

      if (attemptError) throw attemptError;

      for (const [sloId, scores] of Object.entries(sloScores)) {
        const { data: existing } = await supabase
          .from("slo_performance")
          .select("*")
          .eq("student_id", studentId)
          .eq("slo_id", sloId)
          .single();

        const newTotalEarned = (existing?.total_marks_earned || 0) + scores.earned;
        const newTotalPossible = (existing?.total_marks_attempted || 0) + scores.possible;
        const percentage = (newTotalEarned / newTotalPossible) * 100;

        let level: "developmental" | "satisfactory" | "mastery" = "developmental";
        if (percentage >= 85) level = "mastery";
        else if (percentage >= 60) level = "satisfactory";

        if (existing) {
          await supabase
            .from("slo_performance")
            .update({
              total_marks_earned: newTotalEarned,
              total_marks_attempted: newTotalPossible,
              current_proficiency_percentage: percentage,
              current_level: level,
              last_updated: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("slo_performance").insert({
            student_id: studentId,
            slo_id: sloId,
            total_marks_earned: newTotalEarned,
            total_marks_attempted: newTotalPossible,
            current_proficiency_percentage: percentage,
            current_level: level,
          });
        }
      }

      toast.success("Test submitted successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting test:", error);
      toast.error("Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{assessment.title}</CardTitle>
          <CardDescription>
            Subject: {assessment.subjects?.name} | Total Marks: {assessment.total_marks}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                Question {index + 1} ({question.max_marks} marks)
              </CardTitle>
              <CardDescription>{question.question_text}</CardDescription>
            </CardHeader>
            <CardContent>
              {question.question_type === "mcq" ? (
                <RadioGroup value={answers[question.id] || ""} onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}>
                  {(question.options as string[]).map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${question.id}-${i}`} />
                      <Label htmlFor={`${question.id}-${i}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : question.question_type === "short_answer" ? (
                <Input
                  value={answers[question.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  placeholder="Enter your answer"
                />
              ) : (
                <Textarea
                  value={answers[question.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  placeholder="Enter your answer"
                  rows={5}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting} size="lg">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Test
        </Button>
      </div>
    </div>
  );
};

export default TakeTest;
