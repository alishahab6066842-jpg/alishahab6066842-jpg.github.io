import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, History, Target, FileBarChart } from "lucide-react";
import AvailableTestsTab from "./student/AvailableTestsTab";
import TestHistoryTab from "./student/TestHistoryTab";
import SLOReportStudent from "@/components/reports/SLOReportStudent";
import ReportsTab from "./student/ReportsTab";

interface StudentDashboardProps {
  profile: any;
}

const StudentDashboard = ({ profile }: StudentDashboardProps) => {
  const [activeTab, setActiveTab] = useState("tests");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {profile.full_name}!</h2>
        <p className="text-muted-foreground">Take assessments and track your learning progress.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Available Tests
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            My Results
          </TabsTrigger>
          <TabsTrigger value="slo-report" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            SLO Report
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            Progress Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <AvailableTestsTab studentId={profile.id} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <TestHistoryTab studentId={profile.id} />
        </TabsContent>

        <TabsContent value="slo-report" className="space-y-4">
          <SLOReportStudent studentId={profile.id} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsTab studentId={profile.id} studentName={profile.full_name} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
