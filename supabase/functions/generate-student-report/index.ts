import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  studentId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with anon key to verify user token
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    const { studentId }: ReportRequest = await req.json();

    // Fetch student profile
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Fetch all test attempts for the student
    const { data: attempts, error: attemptsError } = await supabase
      .from('test_attempts')
      .select(`
        *,
        assessment:assessments(
          title,
          subject:subjects(name)
        )
      `)
      .eq('student_id', studentId)
      .order('submission_date', { ascending: true });

    if (attemptsError) throw attemptsError;

    // Fetch SLO performance data
    const { data: sloPerformance, error: sloError } = await supabase
      .from('slo_performance')
      .select(`
        *,
        slo:slos(
          description,
          target_proficiency,
          subject:subjects(name)
        )
      `)
      .eq('student_id', studentId);

    if (sloError) throw sloError;

    // Calculate overall statistics
    const totalAttempts = attempts?.length || 0;
    const totalMarksEarned = attempts?.reduce((sum, a) => sum + Number(a.raw_score), 0) || 0;
    const totalMarksPossible = attempts?.reduce((sum, a) => sum + Number(a.total_possible), 0) || 0;
    const averagePercentage = totalMarksPossible > 0 
      ? ((totalMarksEarned / totalMarksPossible) * 100).toFixed(1)
      : '0.0';

    // Count proficiency levels
    const proficiencyCounts = sloPerformance?.reduce((acc, perf) => {
      acc[perf.current_level] = (acc[perf.current_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Prepare report data
    const reportData = {
      student,
      attempts: attempts || [],
      sloPerformance: sloPerformance || [],
      statistics: {
        totalAttempts,
        totalMarksEarned,
        totalMarksPossible,
        averagePercentage,
        proficiencyCounts,
      },
      generatedAt: new Date().toISOString(),
    };

    // Store report metadata
    const reportPath = `${studentId}/report_${Date.now()}.json`;
    
    const { error: insertError } = await supabase
      .from('student_reports')
      .insert({
        student_id: studentId,
        generated_by: user.id,
        report_path: reportPath,
        report_data: reportData,
      });

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: reportData 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});