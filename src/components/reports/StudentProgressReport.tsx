import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileDown, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface StudentProgressReportProps {
  studentId: string;
  studentName: string;
}

const StudentProgressReport = ({ studentId, studentName }: StudentProgressReportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const { toast } = useToast();

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-student-report', {
        body: { studentId },
      });

      if (error) throw error;

      setReportData(data.data);
      toast({
        title: "Report Generated",
        description: "Student progress report has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Student Progress Report", pageWidth / 2, 20, { align: "center" });
    
    // Student Info
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Student: ${studentName}`, 20, 35);
    doc.text(`Generated: ${format(new Date(), 'PPP')}`, 20, 42);
    
    // Overall Statistics
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Overall Performance", 20, 55);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Assessments Completed: ${reportData.statistics.totalAttempts}`, 20, 65);
    doc.text(`Total Marks Earned: ${reportData.statistics.totalMarksEarned} / ${reportData.statistics.totalMarksPossible}`, 20, 72);
    doc.text(`Average Performance: ${reportData.statistics.averagePercentage}%`, 20, 79);
    
    // Proficiency Level Distribution
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Proficiency Level Distribution", 20, 92);
    
    const proficiencyData = [
      ['Level', 'Count'],
      ['Mastery', (reportData.statistics.proficiencyCounts.mastery || 0).toString()],
      ['Satisfactory', (reportData.statistics.proficiencyCounts.satisfactory || 0).toString()],
      ['Developmental', (reportData.statistics.proficiencyCounts.developmental || 0).toString()],
    ];
    
    autoTable(doc, {
      startY: 97,
      head: [proficiencyData[0]],
      body: proficiencyData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // SLO Performance
    if (reportData.sloPerformance.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY || 120;
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SLO Performance Details", 20, finalY + 15);
      
      const sloData = reportData.sloPerformance.map((perf: any) => [
        perf.slo.subject.name,
        perf.slo.description.substring(0, 50) + '...',
        `${perf.current_proficiency_percentage.toFixed(1)}%`,
        perf.current_level,
      ]);
      
      autoTable(doc, {
        startY: finalY + 20,
        head: [['Subject', 'SLO Description', 'Proficiency', 'Level']],
        body: sloData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          1: { cellWidth: 70 },
        },
      });
    }

    // Assessment History
    if (reportData.attempts.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Assessment History", 20, 20);
      
      const attemptData = reportData.attempts.map((attempt: any) => [
        format(new Date(attempt.submission_date), 'PP'),
        attempt.assessment.title,
        attempt.assessment.subject.name,
        `${attempt.raw_score}/${attempt.total_possible}`,
        `${((attempt.raw_score / attempt.total_possible) * 100).toFixed(1)}%`,
      ]);
      
      autoTable(doc, {
        startY: 25,
        head: [['Date', 'Assessment', 'Subject', 'Score', 'Percentage']],
        body: attemptData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    // Save PDF
    doc.save(`${studentName.replace(/\s+/g, '_')}_Progress_Report.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: "The progress report has been downloaded successfully.",
    });
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'mastery': return 'bg-green-500';
      case 'satisfactory': return 'bg-yellow-500';
      case 'developmental': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Progress Report
        </CardTitle>
        <CardDescription>
          Generate comprehensive performance report for {studentName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Button 
            onClick={generateReport} 
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
          {reportData && (
            <Button onClick={downloadPDF} variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          )}
        </div>

        {reportData && (
          <div className="space-y-6">
            {/* Overall Statistics */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Overall Performance</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{reportData.statistics.totalAttempts}</div>
                    <p className="text-sm text-muted-foreground">Total Assessments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{reportData.statistics.averagePercentage}%</div>
                    <p className="text-sm text-muted-foreground">Average Performance</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Proficiency Distribution */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Proficiency Distribution</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mastery</span>
                  <Badge variant="default" className="bg-green-500">
                    {reportData.statistics.proficiencyCounts.mastery || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Satisfactory</span>
                  <Badge variant="default" className="bg-yellow-500">
                    {reportData.statistics.proficiencyCounts.satisfactory || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Developmental</span>
                  <Badge variant="default" className="bg-orange-500">
                    {reportData.statistics.proficiencyCounts.developmental || 0}
                  </Badge>
                </div>
              </div>
            </div>

            {/* SLO Performance */}
            {reportData.sloPerformance.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">SLO Performance</h3>
                <div className="space-y-4">
                  {reportData.sloPerformance.map((perf: any) => (
                    <Card key={perf.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{perf.slo.subject.name}</p>
                              <p className="text-sm text-muted-foreground">{perf.slo.description}</p>
                            </div>
                            <Badge className={getProficiencyColor(perf.current_level)}>
                              {perf.current_level}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Proficiency</span>
                              <span className="font-medium">{perf.current_proficiency_percentage.toFixed(1)}%</span>
                            </div>
                            <Progress value={perf.current_proficiency_percentage} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Target: {perf.slo.target_proficiency}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentProgressReport;