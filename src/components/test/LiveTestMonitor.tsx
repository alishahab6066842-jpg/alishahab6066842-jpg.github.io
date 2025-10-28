import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface LiveTestMonitorProps {
  assessmentId: string;
  assessmentTitle: string;
}

interface TestSession {
  id: string;
  student_id: string;
  started_at: string;
  last_heartbeat: string;
  is_active: boolean;
  submitted_at: string | null;
  profiles: {
    full_name: string;
  };
}

export const LiveTestMonitor = ({ assessmentId, assessmentTitle }: LiveTestMonitorProps) => {
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel(`test-sessions-${assessmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'test_sessions',
          filter: `assessment_id=eq.${assessmentId}`,
        },
        (payload) => {
          console.log('Session change:', payload);
          if (payload.eventType === 'INSERT') {
            toast.info(`Student started the test`);
          } else if (payload.eventType === 'UPDATE' && (payload.new as any).submitted_at) {
            toast.success(`Student submitted the test`);
          }
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [assessmentId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('test_sessions')
        .select('*, profiles(full_name)')
        .eq('assessment_id', assessmentId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeSessions = sessions.filter(s => s.is_active && !s.submitted_at);
  const completedSessions = sessions.filter(s => s.submitted_at);

  const getTimeElapsed = (startTime: string) => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const diff = now - start;
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Live Test Monitor
        </CardTitle>
        <CardDescription>{assessmentTitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{activeSessions.length}</p>
                  <p className="text-sm text-muted-foreground">Currently Taking</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{completedSessions.length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {activeSessions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Test Takers
            </h3>
            <div className="space-y-2">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{session.profiles?.full_name || 'Unknown Student'}</p>
                    <p className="text-sm text-muted-foreground">
                      Started {getTimeElapsed(session.started_at)} ago
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    <div className="h-2 w-2 rounded-full bg-white mr-2 animate-pulse" />
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedSessions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
            </h3>
            <div className="space-y-2">
              {completedSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg opacity-75">
                  <div>
                    <p className="font-medium">{session.profiles?.full_name || 'Unknown Student'}</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted {new Date(session.submitted_at!).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant="secondary">Submitted</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <XCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No students have started this test yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
