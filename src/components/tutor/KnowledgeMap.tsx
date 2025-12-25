import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import { Brain } from "lucide-react";

interface KnowledgeMapData {
  subject: string;
  fullName: string;
  value: number;
  fullMark: number;
}

interface KnowledgeMapProps {
  data: KnowledgeMapData[];
}

const KnowledgeMap = ({ data }: KnowledgeMapProps) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Knowledge Map
          </CardTitle>
          <CardDescription>Your learning strengths and areas for growth</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Complete some assessments to see your knowledge map!</p>
        </CardContent>
      </Card>
    );
  }

  // Limit to 8 data points for readability
  const displayData = data.slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Knowledge Map
        </CardTitle>
        <CardDescription>Your learning strengths and areas for growth</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={displayData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
                tickCount={5}
              />
              <Radar
                name="Proficiency"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="font-medium text-sm">{data.fullName}</p>
                        <p className="text-primary text-lg font-bold">{data.value}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <div className="flex items-center gap-2 text-xs">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>85-100% Mastery</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <span>60-84% Satisfactory</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span>&lt;60% Developmental</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KnowledgeMap;
