import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  wrongAnswerFeedback: Record<string, string>;
  difficulty: string;
  estimatedTime: string;
}

interface PracticeData {
  questions: Question[];
  contentType: string;
  totalEstimatedTime: string;
}

interface PracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  practiceData: PracticeData | null;
  sloInfo: { name: string; percentage: number } | null;
}

const PracticeModal = ({ isOpen, onClose, practiceData, sloInfo }: PracticeModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  if (!practiceData || !practiceData.questions) return null;

  const questions = practiceData.questions;
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (option: string) => {
    if (showFeedback) return;
    
    const letter = option.charAt(0);
    setSelectedAnswer(letter);
    setShowFeedback(true);

    if (letter === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setCompleted(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Practice: {sloInfo?.name}</span>
            <Badge variant="outline">{practiceData.contentType}</Badge>
          </DialogTitle>
          <DialogDescription>
            Current mastery: {sloInfo?.percentage}% • {practiceData.totalEstimatedTime}
          </DialogDescription>
        </DialogHeader>

        {completed ? (
          <div className="py-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Practice Complete!</h3>
              <p className="text-muted-foreground">
                You scored {score} out of {questions.length} questions correctly
              </p>
            </div>
            <div className="w-48 mx-auto">
              <Progress value={(score / questions.length) * 100} className="h-3" />
              <p className="text-sm mt-2 font-medium">
                {Math.round((score / questions.length) * 100)}% accuracy
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>Score: {score}/{currentIndex + (showFeedback ? 1 : 0)}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <span className="font-bold text-lg shrink-0">Q{currentIndex + 1}.</span>
                <p className="text-lg">{currentQuestion.question}</p>
              </div>

              <div className="space-y-2">
                {currentQuestion.options.map((option, idx) => {
                  const letter = option.charAt(0);
                  const isSelected = selectedAnswer === letter;
                  const isCorrectOption = letter === currentQuestion.correctAnswer;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showFeedback}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border transition-all",
                        "hover:bg-accent/50 disabled:cursor-not-allowed",
                        !showFeedback && "hover:border-primary",
                        showFeedback && isCorrectOption && "bg-green-50 border-green-500",
                        showFeedback && isSelected && !isCorrectOption && "bg-red-50 border-red-500",
                        isSelected && !showFeedback && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {showFeedback && isCorrectOption && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {showFeedback && isSelected && !isCorrectOption && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div className={cn(
                  "p-4 rounded-lg",
                  isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                )}>
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={cn(
                        "font-medium",
                        isCorrect ? "text-green-800" : "text-red-800"
                      )}>
                        {isCorrect ? "Correct!" : "Not quite right"}
                      </p>
                      <p className="text-sm mt-1 text-muted-foreground">
                        {isCorrect 
                          ? currentQuestion.explanation 
                          : (selectedAnswer && currentQuestion.wrongAnswerFeedback[selectedAnswer]) || currentQuestion.explanation
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleNext} 
                disabled={!showFeedback}
              >
                {currentIndex < questions.length - 1 ? (
                  <>
                    Next Question <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  "View Results"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PracticeModal;
