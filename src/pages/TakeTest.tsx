import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { CountdownTimer } from "@/components/test/CountdownTimer";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TakeTest = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [studentId, setStudentId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [hasStarted, setHasStarted] = useState(false);
  const [testAvailable, setTestAvailable] = useState(true);
  const submittingRef = useRef(false);

  useEffect(() => {
    fetchTestData();
  }, [assessmentId]);

  useEffect(() => {
    if (!hasStarted || !sessionId) return;

    const heartbeat = setInterval(async () => {
      await supabase
        .from('test_sessions')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('id', sessionId);
    }, 10000);

    return () => clearInterval(heartbeat);
  }, [hasStarted, sessionId]);

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

      // Check if test is live and if it's time-restricted
      if (assessmentRes.data.is_live) {
        const now = new Date();
        const startTime = assessmentRes.data.start_time ? new Date(assessmentRes.data.start_time) : null;
        const endTime = assessmentRes.data.end_time ? new Date(assessmentRes.data.end_time) : null;

        if (startTime && now < startTime) {
          setTestAvailable(false);
          toast.error(`Test starts at ${startTime.toLocaleString()}`);
        } else if (endTime && now > endTime) {
          setTestAvailable(false);
          toast.error("Test has ended");
        }
      }
    } catch (error) {
      console.error("Error fetching test:", error);
      toast.error("Failed to load test");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const startTest = async () => {
    try {
      const { data: session, error } = await supabase
        .from('test_sessions')
        .insert({
          assessment_id: assessmentId,
          student_id: studentId,
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(session.id);
      setHasStarted(true);
      toast.success("Test started! Good luck!");
    } catch (error) {
      console.error("Error starting test:", error);
      toast.error("Failed to start test");
    }
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    if (!isAutoSubmit && Object.keys(answers).length !== questions.length) {
      toast.error("Please answer all questions before submitting");
      submittingRef.current = false;
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

      // Update session
      if (sessionId) {
        await supabase
          .from('test_sessions')
          .update({ 
            submitted_at: new Date().toISOString(),
            is_active: false 
          })
          .eq('id', sessionId);
      }

      toast.success(isAutoSubmit ? "Time expired - test submitted automatically!" : "Test submitted successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting test:", error);
      toast.error("Failed to submit test");
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!testAvailable) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            This test is not currently available. Please check the start and end times.
          </AlertDescription>
        </Alert>
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!hasStarted && assessment?.is_live) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>{assessment.title}</CardTitle>
            <CardDescription>
              Subject: {assessment.subjects?.name} | Duration: {assessment.duration_minutes} minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                This is a timed test. Once you start, you will have {assessment.duration_minutes} minutes to complete it.
                The test will auto-submit when time expires.
              </AlertDescription>
            </Alert>
            <div className="flex gap-4">
              <Button onClick={startTest} size="lg">Start Test</Button>
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <Card>
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

          <div className="flex justify-end">
            <Button onClick={() => handleSubmit(false)} disabled={submitting} size="lg">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Test
            </Button>
          </div>
        </div>

        {assessment?.is_live && assessment.end_time && (
          <div className="lg:col-span-1">
            <CountdownTimer 
              endTime={assessment.end_time} 
              onExpire={() => handleSubmit(true)} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeTest;
