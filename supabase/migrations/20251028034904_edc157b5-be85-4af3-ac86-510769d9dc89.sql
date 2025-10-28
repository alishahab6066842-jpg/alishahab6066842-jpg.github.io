-- Add timing fields to assessments table
ALTER TABLE assessments
ADD COLUMN duration_minutes INTEGER,
ADD COLUMN start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_live BOOLEAN DEFAULT false;

-- Create test_sessions table to track active test takers
CREATE TABLE test_sessions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, student_id)
);

-- Enable RLS on test_sessions
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

-- Students can create and update their own sessions
CREATE POLICY "Students can create own sessions"
ON test_sessions FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own sessions"
ON test_sessions FOR UPDATE
USING (student_id = auth.uid());

-- Students can view own sessions
CREATE POLICY "Students can view own sessions"
ON test_sessions FOR SELECT
USING (student_id = auth.uid());

-- Teachers can view sessions for their assessments
CREATE POLICY "Teachers can view sessions for own assessments"
ON test_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = test_sessions.assessment_id
    AND assessments.teacher_id = auth.uid()
  )
);

-- Enable realtime for test_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE test_sessions;

-- Create index for faster queries
CREATE INDEX idx_test_sessions_assessment ON test_sessions(assessment_id);
CREATE INDEX idx_test_sessions_active ON test_sessions(is_active) WHERE is_active = true;