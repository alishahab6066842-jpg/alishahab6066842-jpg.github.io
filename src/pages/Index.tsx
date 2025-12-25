import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Target, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <GraduationCap className="h-10 w-10" />
            </div>
          </div>

          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            Student Learning Outcomes
            <span className="block text-primary">Management System</span>
          </h1>

          <p className="mb-12 text-xl text-muted-foreground">
            Track, measure, and achieve learning outcomes with data-driven insights.
            Empower teachers and students with comprehensive assessment tools.
          </p>

          <div className="mb-16 flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="shadow-lg">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Learn More
            </Button>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Smart Assessments</h3>
              <p className="text-sm text-muted-foreground">
                Create assessments with intelligent question-to-SLO mapping for precise tracking
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Target className="h-6 w-6" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Outcome Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor student proficiency across all learning outcomes with real-time updates
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">Data-Driven Insights</h3>
              <p className="text-sm text-muted-foreground">
                Generate comprehensive reports to guide instruction and celebrate growth
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
