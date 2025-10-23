import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Question {
  id: string;
  question_text: string;
  question_type: "mcq" | "short_answer" | "true_false";
  options?: string[];
  correct_answer: string;
  max_marks: number;
  slo_mappings: { slo_id: string; marks: number }[];
}

interface CreateAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: any[];
  teacherId: string;
  onSuccess: () => void;
}

const CreateAssessmentDialog = ({ open, onOpenChange, subjects, teacherId, onSuccess }: CreateAssessmentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [slos, setSlos] = useState<any[]>([]);

  const handleSubjectChange = async (value: string) => {
    setSubjectId(value);
    const { data } = await supabase.from("slos").select("*").eq("subject_id", value);
    setSlos(data || []);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question_text: "",
        question_type: "mcq",
        options: ["", "", "", ""],
        correct_answer: "",
        max_marks: 1,
        slo_mappings: [],
      },
    ]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const parseBulkMCQs = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const newQuestions: Question[] = [];
    let currentQ: Partial<Question> = {};
    let options: string[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^Q:/i)) {
        if (currentQ.question_text && options.length >= 2) {
          newQuestions.push({
            id: crypto.randomUUID(),
            question_text: currentQ.question_text,
            question_type: "mcq",
            options: options,
            correct_answer: currentQ.correct_answer || "",
            max_marks: currentQ.max_marks || 1,
            slo_mappings: [],
          });
        }
        currentQ = { question_text: trimmed.substring(2).trim() };
        options = [];
      } else if (trimmed.match(/^[A-D]:/i)) {
        options.push(trimmed.substring(2).trim());
      } else if (trimmed.match(/^Correct:/i)) {
        const correctLetter = trimmed.substring(8).trim().toUpperCase();
        const index = correctLetter.charCodeAt(0) - 65;
        currentQ.correct_answer = options[index] || "";
      } else if (trimmed.match(/^Marks:/i)) {
        currentQ.max_marks = parseInt(trimmed.substring(6).trim()) || 1;
      }
    });

    if (currentQ.question_text && options.length >= 2) {
      newQuestions.push({
        id: crypto.randomUUID(),
        question_text: currentQ.question_text,
        question_type: "mcq",
        options: options,
        correct_answer: currentQ.correct_answer || "",
        max_marks: currentQ.max_marks || 1,
        slo_mappings: [],
      });
    }

    return newQuestions;
  };

  const parseBulkShortAnswer = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const newQuestions: Question[] = [];
    let currentQ: Partial<Question> = {};

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^Q:/i)) {
        if (currentQ.question_text && currentQ.correct_answer) {
          newQuestions.push({
            id: crypto.randomUUID(),
            question_text: currentQ.question_text,
            question_type: "short_answer",
            correct_answer: currentQ.correct_answer,
            max_marks: currentQ.max_marks || 1,
            slo_mappings: [],
          });
        }
        currentQ = { question_text: trimmed.substring(2).trim() };
      } else if (trimmed.match(/^A:/i)) {
        currentQ.correct_answer = trimmed.substring(2).trim();
      } else if (trimmed.match(/^Marks:/i)) {
        currentQ.max_marks = parseInt(trimmed.substring(6).trim()) || 1;
      }
    });

    if (currentQ.question_text && currentQ.correct_answer) {
      newQuestions.push({
        id: crypto.randomUUID(),
        question_text: currentQ.question_text,
        question_type: "short_answer",
        correct_answer: currentQ.correct_answer,
        max_marks: currentQ.max_marks || 1,
        slo_mappings: [],
      });
    }

    return newQuestions;
  };

  const parseBulkTrueFalse = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const newQuestions: Question[] = [];
    let currentQ: Partial<Question> = {};

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^Q:/i)) {
        if (currentQ.question_text && currentQ.correct_answer) {
          newQuestions.push({
            id: crypto.randomUUID(),
            question_text: currentQ.question_text,
            question_type: "true_false",
            correct_answer: currentQ.correct_answer,
            max_marks: currentQ.max_marks || 1,
            slo_mappings: [],
          });
        }
        currentQ = { question_text: trimmed.substring(2).trim() };
      } else if (trimmed.match(/^A:/i)) {
        const answer = trimmed.substring(2).trim().toLowerCase();
        currentQ.correct_answer = answer === "true" || answer === "t" ? "True" : "False";
      } else if (trimmed.match(/^Marks:/i)) {
        currentQ.max_marks = parseInt(trimmed.substring(6).trim()) || 1;
      }
    });

    if (currentQ.question_text && currentQ.correct_answer) {
      newQuestions.push({
        id: crypto.randomUUID(),
        question_text: currentQ.question_text,
        question_type: "true_false",
        correct_answer: currentQ.correct_answer,
        max_marks: currentQ.max_marks || 1,
        slo_mappings: [],
      });
    }

    return newQuestions;
  };

  const handleBulkUpload = (type: "mcq" | "short_answer" | "true_false", text: string) => {
    if (!text.trim()) {
      toast.error("Please paste question content");
      return;
    }

    let parsed: Question[] = [];
    try {
      if (type === "mcq") {
        parsed = parseBulkMCQs(text);
      } else if (type === "short_answer") {
        parsed = parseBulkShortAnswer(text);
      } else if (type === "true_false") {
        parsed = parseBulkTrueFalse(text);
      }

      if (parsed.length === 0) {
        toast.error("No valid questions found. Please check the format.");
        return;
      }

      setQuestions([...questions, ...parsed]);
      toast.success(`Added ${parsed.length} question(s)`);
    } catch (error) {
      toast.error("Error parsing questions. Please check the format.");
    }
  };

  const updateSloMapping = (questionId: string, sloId: string, marks: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const existing = q.slo_mappings.find((m) => m.slo_id === sloId);
          if (existing) {
            return {
              ...q,
              slo_mappings: q.slo_mappings.map((m) => (m.slo_id === sloId ? { ...m, marks } : m)),
            };
          }
          return { ...q, slo_mappings: [...q.slo_mappings, { slo_id: sloId, marks }] };
        }
        return q;
      })
    );
  };

  const handleSubmit = async () => {
    if (!title || !subjectId || questions.length === 0) {
      toast.error("Please fill all required fields");
      return;
    }

    for (const q of questions) {
      const totalMapped = q.slo_mappings.reduce((sum, m) => sum + m.marks, 0);
      if (totalMapped !== q.max_marks) {
        toast.error(`Question "${q.question_text}" must have all marks mapped to SLOs`);
        return;
      }
    }

    setLoading(true);
    try {
      const totalMarks = questions.reduce((sum, q) => sum + q.max_marks, 0);
      const { data: assessment, error: assessmentError } = await supabase
        .from("assessments")
        .insert({
          title,
          subject_id: subjectId,
          teacher_id: teacherId,
          total_marks: totalMarks,
          is_published: true,
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: question, error: questionError } = await supabase
          .from("questions")
          .insert({
            assessment_id: assessment.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.question_type === "mcq" ? q.options : null,
            correct_answer: q.correct_answer,
            max_marks: q.max_marks,
            order_number: i + 1,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        for (const mapping of q.slo_mappings) {
          const { error: mappingError } = await supabase.from("question_slo_mappings").insert({
            question_id: question.id,
            slo_id: mapping.slo_id,
            mark_contribution: mapping.marks,
          });

          if (mappingError) throw mappingError;
        }
      }

      toast.success("Assessment created successfully!");
      onSuccess();
      onOpenChange(false);
      setTitle("");
      setSubjectId("");
      setQuestions([]);
    } catch (error) {
      console.error("Error creating assessment:", error);
      toast.error("Failed to create assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Assessment</DialogTitle>
          <DialogDescription>Design a new assessment with questions and SLO mappings</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Assessment Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Mid-term Exam" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subjectId} onValueChange={handleSubjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {subjectId && slos.length === 0 && (
            <p className="text-sm text-destructive">No SLOs found for this subject. Please create SLOs first.</p>
          )}

          {subjectId && slos.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Questions</h3>
                <Button onClick={addQuestion} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Bulk Upload Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload MCQs
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <strong>Format:</strong>
                        <pre className="mt-1">
Q: Question text here?{'\n'}A: Option A{'\n'}B: Option B{'\n'}C: Option C{'\n'}D: Option D{'\n'}Correct: A{'\n'}Marks: 2{'\n\n'}Q: Next question...
                        </pre>
                      </div>
                      <Textarea
                        placeholder="Paste MCQ questions here..."
                        className="min-h-[100px] font-mono text-xs"
                        id="mcq-bulk"
                      />
                      <Button
                        onClick={() => {
                          const text = (document.getElementById("mcq-bulk") as HTMLTextAreaElement).value;
                          handleBulkUpload("mcq", text);
                          (document.getElementById("mcq-bulk") as HTMLTextAreaElement).value = "";
                        }}
                        size="sm"
                      >
                        Import MCQs
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Short Questions
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <strong>Format:</strong>
                        <pre className="mt-1">
Q: Question text here?{'\n'}A: Answer here{'\n'}Marks: 2{'\n\n'}Q: Next question...
                        </pre>
                      </div>
                      <Textarea
                        placeholder="Paste short answer questions here..."
                        className="min-h-[100px] font-mono text-xs"
                        id="short-bulk"
                      />
                      <Button
                        onClick={() => {
                          const text = (document.getElementById("short-bulk") as HTMLTextAreaElement).value;
                          handleBulkUpload("short_answer", text);
                          (document.getElementById("short-bulk") as HTMLTextAreaElement).value = "";
                        }}
                        size="sm"
                      >
                        Import Short Questions
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload True/False
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <strong>Format:</strong>
                        <pre className="mt-1">
Q: Statement here{'\n'}A: True{'\n'}Marks: 1{'\n\n'}Q: Next statement...
                        </pre>
                      </div>
                      <Textarea
                        placeholder="Paste true/false questions here..."
                        className="min-h-[100px] font-mono text-xs"
                        id="tf-bulk"
                      />
                      <Button
                        onClick={() => {
                          const text = (document.getElementById("tf-bulk") as HTMLTextAreaElement).value;
                          handleBulkUpload("true_false", text);
                          (document.getElementById("tf-bulk") as HTMLTextAreaElement).value = "";
                        }}
                        size="sm"
                      >
                        Import True/False
                      </Button>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>

              {questions.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Question {index + 1}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => deleteQuestion(question.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Text</Label>
                      <Textarea
                        value={question.question_text}
                        onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                        placeholder="Enter question text"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Question Type</Label>
                        <Select
                          value={question.question_type}
                          onValueChange={(value: any) => updateQuestion(question.id, { question_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">Multiple Choice</SelectItem>
                            <SelectItem value="short_answer">Short Answer</SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Max Marks</Label>
                        <Input
                          type="number"
                          value={question.max_marks}
                          onChange={(e) => updateQuestion(question.id, { max_marks: Number(e.target.value) })}
                          min="1"
                        />
                      </div>
                    </div>

                    {question.question_type === "mcq" && (
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {question.options?.map((option, i) => (
                          <Input
                            key={i}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(question.options || [])];
                              newOptions[i] = e.target.value;
                              updateQuestion(question.id, { options: newOptions });
                            }}
                            placeholder={`Option ${i + 1}`}
                          />
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Correct Answer</Label>
                      {question.question_type === "mcq" ? (
                        <RadioGroup
                          value={question.correct_answer}
                          onValueChange={(value) => updateQuestion(question.id, { correct_answer: value })}
                        >
                          {question.options?.map((option, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${question.id}-${i}`} />
                              <Label htmlFor={`${question.id}-${i}`}>{option || `Option ${i + 1}`}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <Input
                          value={question.correct_answer}
                          onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
                          placeholder="Enter correct answer"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>SLO Mark Mapping (Total: {question.slo_mappings.reduce((s, m) => s + m.marks, 0)}/{question.max_marks})</Label>
                      <div className="grid gap-2">
                        {slos.map((slo) => (
                          <div key={slo.id} className="flex items-center gap-2">
                            <Label className="flex-1 text-sm">{slo.description}</Label>
                            <Input
                              type="number"
                              className="w-20"
                              value={question.slo_mappings.find((m) => m.slo_id === slo.id)?.marks || 0}
                              onChange={(e) => updateSloMapping(question.id, slo.id, Number(e.target.value))}
                              min="0"
                              max={question.max_marks}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Assessment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssessmentDialog;
