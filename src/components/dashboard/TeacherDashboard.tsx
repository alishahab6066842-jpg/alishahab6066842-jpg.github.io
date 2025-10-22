import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, Target } from "lucide-react";
import SubjectsTab from "./teacher/SubjectsTab";
import AssessmentsTab from "./teacher/AssessmentsTab";
import SLOsTab from "./teacher/SLOsTab";

interface TeacherDashboardProps {
  profile: any;
}

const TeacherDashboard = ({ profile }: TeacherDashboardProps) => {
  const [activeTab, setActiveTab] = useState("subjects");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {profile.full_name}!</h2>
        <p className="text-muted-foreground">Manage your subjects, assessments, and learning outcomes.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="slos" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Learning Outcomes
          </TabsTrigger>
          <TabsTrigger value="assessments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Assessments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4">
          <SubjectsTab teacherId={profile.id} />
        </TabsContent>

        <TabsContent value="slos" className="space-y-4">
          <SLOsTab teacherId={profile.id} />
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <AssessmentsTab teacherId={profile.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;
