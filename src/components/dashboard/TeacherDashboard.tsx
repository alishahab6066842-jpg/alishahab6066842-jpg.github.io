import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, Target, BarChart, Clock, FileBarChart } from "lucide-react";
import SubjectsTab from "./teacher/SubjectsTab";
import AssessmentsTab from "./teacher/AssessmentsTab";
import SLOsTab from "./teacher/SLOsTab";
import SLOReportTeacher from "@/components/reports/SLOReportTeacher";
import { LiveTestsTab } from "./teacher/LiveTestsTab";
import StudentReportsTab from "./teacher/StudentReportsTab";

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
        <TabsList className="grid w-full grid-cols-6">
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
          <TabsTrigger value="live-tests" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Live Tests
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            SLO Reports
          </TabsTrigger>
          <TabsTrigger value="student-reports" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            Student Reports
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

        <TabsContent value="live-tests" className="space-y-4">
          <LiveTestsTab teacherId={profile.id} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <SLOReportTeacher teacherId={profile.id} />
        </TabsContent>

        <TabsContent value="student-reports" className="space-y-4">
          <StudentReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;
