import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRecommendationEngine, SLOPerformance } from "@/hooks/useRecommendationEngine";
import AITutorWidget from "@/components/tutor/AITutorWidget";
import KnowledgeMap from "@/components/tutor/KnowledgeMap";
import ActionableFeed from "@/components/tutor/ActionableFeed";
import MasteryBadges from "@/components/tutor/MasteryBadges";
import TutorStats from "@/components/tutor/TutorStats";

interface AITutorTabProps {
  studentId: string;
  studentName: string;
}

const AITutorTab = ({ studentId, studentName }: AITutorTabProps) => {
  const [performanceData, setPerformanceData] = useState<SLOPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const { recommendations, masteryBadges, knowledgeMapData, stats } = useRecommendationEngine(performanceData);

  useEffect(() => {
    fetchPerformanceData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('slo-performance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'slo_performance',
          filter: `student_id=eq.${studentId}`
        },
        () => {
          console.log("SLO performance updated, refreshing...");
          fetchPerformanceData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const fetchPerformanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('slo_performance')
        .select(`
          *,
          slo:slos (
            id,
            description,
            subject_id,
            target_proficiency,
            subjects (
              name
            )
          )
        `)
        .eq('student_id', studentId);

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData: SLOPerformance[] = (data || []).map(item => ({
        ...item,
        slo: item.slo ? {
          ...item.slo,
          subjects: item.slo.subjects
        } : undefined
      }));

      setPerformanceData(transformedData);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      toast({
        title: "Error",
        description: "Failed to load your learning data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const topRecommendation = recommendations[0]?.sloName;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <TutorStats stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Knowledge Map */}
        <KnowledgeMap data={knowledgeMapData} />
        
        {/* Mastery Badges */}
        <MasteryBadges badges={masteryBadges} />
      </div>

      {/* Actionable Feed */}
      <ActionableFeed recommendations={recommendations} />

      {/* Floating Tutor Widget */}
      <AITutorWidget 
        studentName={studentName}
        averageScore={stats.averageScore}
        topRecommendation={topRecommendation}
      />
    </div>
  );
};

export default AITutorTab;
