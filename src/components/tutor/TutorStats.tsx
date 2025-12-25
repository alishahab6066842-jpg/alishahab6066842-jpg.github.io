import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, Award, BookOpen, Zap } from "lucide-react";

interface TutorStatsProps {
  stats: {
    mastery: number;
    satisfactory: number;
    developmental: number;
    averageScore: number;
  };
}

const TutorStats = ({ stats }: TutorStatsProps) => {
  const total = stats.mastery + stats.satisfactory + stats.developmental;

  const statCards = [
    {
      label: "Average Score",
      value: `${stats.averageScore}%`,
      icon: Target,
      color: stats.averageScore >= 85 ? "text-green-600" : stats.averageScore >= 60 ? "text-yellow-600" : "text-red-600",
      bgColor: stats.averageScore >= 85 ? "bg-green-100" : stats.averageScore >= 60 ? "bg-yellow-100" : "bg-red-100"
    },
    {
      label: "Mastered",
      value: stats.mastery,
      subtext: "SLOs at 85%+",
      icon: Award,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      label: "Satisfactory",
      value: stats.satisfactory,
      subtext: "SLOs at 60-84%",
      icon: BookOpen,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      label: "Developing",
      value: stats.developmental,
      subtext: "SLOs below 60%",
      icon: Zap,
      color: "text-red-600",
      bgColor: "bg-red-100"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, idx) => (
        <Card key={idx}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                {stat.subtext && (
                  <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TutorStats;
