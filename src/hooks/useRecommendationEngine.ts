import { useMemo } from "react";

export type MasteryLevel = "mastery" | "satisfactory" | "developmental";

export interface SLOPerformance {
  id: string;
  slo_id: string;
  student_id: string;
  current_proficiency_percentage: number;
  current_level: MasteryLevel;
  total_marks_earned: number;
  total_marks_attempted: number;
  last_updated: string;
  slo?: {
    id: string;
    description: string;
    subject_id: string;
    target_proficiency: number;
    subjects?: {
      name: string;
    };
  };
}

export interface ContentRecommendation {
  sloId: string;
  sloName: string;
  subjectName: string;
  masteryPercentage: number;
  masteryLevel: MasteryLevel;
  contentType: "challenge" | "reinforcement" | "foundational";
  contentLabel: string;
  description: string;
  estimatedTime: string;
  activities: string[];
  priority: number;
}

export interface MasteryBadge {
  sloId: string;
  sloName: string;
  achievedAt: string;
  badgeType: "bronze" | "silver" | "gold";
}

export function getMasteryLevel(percentage: number): MasteryLevel {
  if (percentage >= 85) return "mastery";
  if (percentage >= 60) return "satisfactory";
  return "developmental";
}

export function getContentType(percentage: number): "challenge" | "reinforcement" | "foundational" {
  if (percentage >= 85) return "challenge";
  if (percentage >= 60) return "reinforcement";
  return "foundational";
}

export function getContentDetails(contentType: "challenge" | "reinforcement" | "foundational") {
  switch (contentType) {
    case "challenge":
      return {
        label: "Challenge Mode",
        description: "Push your limits with advanced content",
        estimatedTime: "20-30 min",
        activities: [
          "Advanced worksheets",
          "Critical thinking tasks",
          "Peer-teaching exercises",
          "Complex problem solving"
        ]
      };
    case "reinforcement":
      return {
        label: "Reinforcement",
        description: "Strengthen your understanding",
        estimatedTime: "15-20 min",
        activities: [
          "Standard practice tests",
          "Mid-level exercises",
          "Review quizzes",
          "Application problems"
        ]
      };
    case "foundational":
      return {
        label: "Back to Basics",
        description: "Build a strong foundation",
        estimatedTime: "25-35 min",
        activities: [
          "Video tutorials",
          "Step-by-step worksheets",
          "Flashcard practice",
          "Guided examples"
        ]
      };
  }
}

export function useRecommendationEngine(performanceData: SLOPerformance[]) {
  const recommendations = useMemo<ContentRecommendation[]>(() => {
    if (!performanceData || performanceData.length === 0) return [];

    return performanceData
      .map((perf) => {
        const contentType = getContentType(perf.current_proficiency_percentage);
        const details = getContentDetails(contentType);
        
        // Priority: foundational/developmental (3) > reinforcement/satisfactory (2) > challenge/mastery (1)
        let priority = 1;
        if (contentType === "foundational") priority = 3;
        else if (contentType === "reinforcement") priority = 2;

        return {
          sloId: perf.slo_id,
          sloName: perf.slo?.description || "Unknown SLO",
          subjectName: perf.slo?.subjects?.name || "Unknown Subject",
          masteryPercentage: perf.current_proficiency_percentage,
          masteryLevel: getMasteryLevel(perf.current_proficiency_percentage),
          contentType,
          contentLabel: details.label,
          description: details.description,
          estimatedTime: details.estimatedTime,
          activities: details.activities,
          priority
        };
      })
      .sort((a, b) => b.priority - a.priority);
  }, [performanceData]);

  const masteryBadges = useMemo<MasteryBadge[]>(() => {
    if (!performanceData || performanceData.length === 0) return [];

    return performanceData
      .filter(perf => perf.current_proficiency_percentage >= 85)
      .map(perf => ({
        sloId: perf.slo_id,
        sloName: perf.slo?.description || "Unknown SLO",
        achievedAt: perf.last_updated,
        badgeType: perf.current_proficiency_percentage >= 95 ? "gold" : 
                   perf.current_proficiency_percentage >= 90 ? "silver" : "bronze"
      }));
  }, [performanceData]);

  const knowledgeMapData = useMemo(() => {
    if (!performanceData || performanceData.length === 0) return [];

    return performanceData.map(perf => ({
      subject: perf.slo?.description?.substring(0, 20) + "..." || "SLO",
      fullName: perf.slo?.description || "Unknown",
      value: perf.current_proficiency_percentage,
      fullMark: 100
    }));
  }, [performanceData]);

  const stats = useMemo(() => {
    if (!performanceData || performanceData.length === 0) {
      return { mastery: 0, satisfactory: 0, developmental: 0, averageScore: 0 };
    }

    const mastery = performanceData.filter(p => p.current_proficiency_percentage >= 85).length;
    const satisfactory = performanceData.filter(p => p.current_proficiency_percentage >= 60 && p.current_proficiency_percentage < 85).length;
    const developmental = performanceData.filter(p => p.current_proficiency_percentage < 60).length;
    const averageScore = performanceData.reduce((acc, p) => acc + p.current_proficiency_percentage, 0) / performanceData.length;

    return { mastery, satisfactory, developmental, averageScore: Math.round(averageScore) };
  }, [performanceData]);

  return {
    recommendations,
    masteryBadges,
    knowledgeMapData,
    stats
  };
}
