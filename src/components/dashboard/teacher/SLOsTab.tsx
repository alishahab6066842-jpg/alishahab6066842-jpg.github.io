import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SLOsTabProps {
  teacherId: string;
}

const SLOsTab = ({ teacherId }: SLOsTabProps) => {
  const [slos, setSlos] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject_id: "",
    description: "",
    target_proficiency: "85",
  });

  useEffect(() => {
    fetchData();
  }, [teacherId]);

  const fetchData = async () => {
    try {
      const [subjectsRes, slosRes] = await Promise.all([
        supabase.from("subjects").select("*").eq("teacher_id", teacherId),
        supabase
          .from("slos")
          .select("*, subjects(name)")
          .order("created_at", { ascending: false }),
      ]);

      if (subjectsRes.error) throw subjectsRes.error;
      if (slosRes.error) throw slosRes.error;

      setSubjects(subjectsRes.data || []);
      setSlos(slosRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load learning outcomes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("slos").insert({
        subject_id: formData.subject_id,
        description: formData.description,
        target_proficiency: parseFloat(formData.target_proficiency),
      });

      if (error) throw error;

      toast.success("Learning outcome created successfully!");
      setDialogOpen(false);
      setFormData({ subject_id: "", description: "", target_proficiency: "85" });
      fetchData();
    } catch (error) {
      console.error("Error creating SLO:", error);
      toast.error("Failed to create learning outcome");
    } finally {
      setSubmitting(false);
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
          <h3 className="text-2xl font-semibold">Student Learning Outcomes</h3>
          <p className="text-sm text-muted-foreground">Define the learning outcomes for your subjects</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={subjects.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              New SLO
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Learning Outcome</DialogTitle>
              <DialogDescription>Define a new student learning outcome</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={formData.subject_id} onValueChange={(v) => setFormData({ ...formData, subject_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
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
              <div className="space-y-2">
                <Label htmlFor="description">SLO Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Students will be able to solve quadratic equations"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target Proficiency (%)</Label>
                <Input
                  id="target"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.target_proficiency}
                  onChange={(e) => setFormData({ ...formData, target_proficiency: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">The proficiency level students should achieve</p>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create SLO
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Create a subject first</h3>
            <p className="text-sm text-muted-foreground">You need to create at least one subject before adding SLOs</p>
          </CardContent>
        </Card>
      ) : slos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No learning outcomes yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">Define your first learning outcome to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {slos.map((slo) => (
            <Card key={slo.id} className="transition-all hover:shadow-md">
              <CardHeader>
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Target className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    Target: {slo.target_proficiency}%
                  </span>
                </div>
                <CardTitle className="text-base">{slo.description}</CardTitle>
                <CardDescription>{slo.subjects?.name}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SLOsTab;
