import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Medal, Trophy, Star } from "lucide-react";
import { format } from "date-fns";
import { MasteryBadge } from "@/hooks/useRecommendationEngine";

interface MasteryBadgesProps {
  badges: MasteryBadge[];
}

const MasteryBadges = ({ badges }: MasteryBadgesProps) => {
  const getBadgeIcon = (type: "bronze" | "silver" | "gold") => {
    switch (type) {
      case "gold": return <Trophy className="h-6 w-6 text-yellow-500" />;
      case "silver": return <Medal className="h-6 w-6 text-gray-400" />;
      case "bronze": return <Award className="h-6 w-6 text-amber-600" />;
    }
  };

  const getBadgeColor = (type: "bronze" | "silver" | "gold") => {
    switch (type) {
      case "gold": return "bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300";
      case "silver": return "bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300";
      case "bronze": return "bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Mastery Badges
        </CardTitle>
        <CardDescription>
          Achievements earned by reaching 85%+ proficiency
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!badges || badges.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              No badges yet! Keep learning to earn your first mastery badge.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.sloId}
                className={`p-4 rounded-lg border ${getBadgeColor(badge.badgeType)} relative overflow-hidden group transition-transform hover:scale-105`}
              >
                <div className="absolute top-0 right-0 opacity-10">
                  {getBadgeIcon(badge.badgeType)}
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-2 rounded-full bg-white/50">
                    {getBadgeIcon(badge.badgeType)}
                  </div>
                  <div>
                    <p className="font-medium text-sm line-clamp-2">{badge.sloName}</p>
                    <Badge variant="secondary" className="mt-1 text-xs capitalize">
                      {badge.badgeType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(badge.achievedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MasteryBadges;
