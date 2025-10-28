-- Create storage bucket for student reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-reports',
  'student-reports',
  false,
  10485760,
  ARRAY['application/pdf']
);

-- Create storage policies for student reports
CREATE POLICY "Teachers can upload reports"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'student-reports' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
  )
);

CREATE POLICY "Teachers can view all reports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'student-reports' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
  )
);

CREATE POLICY "Students can view own reports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'student-reports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Teachers can delete reports"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'student-reports' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
  )
);

-- Create table to track generated reports
CREATE TABLE IF NOT EXISTS student_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES profiles(id),
  report_path TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  report_data JSONB,
  UNIQUE(student_id, generated_at)
);

-- Enable RLS on student_reports
ALTER TABLE student_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_reports
CREATE POLICY "Teachers can create reports"
ON student_reports
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
  )
);

CREATE POLICY "Teachers can view all reports"
ON student_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
  )
);

CREATE POLICY "Students can view own reports"
ON student_reports
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers can delete reports"
ON student_reports
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
  )
);