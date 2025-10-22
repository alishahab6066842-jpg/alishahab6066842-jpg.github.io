-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('teacher', 'student');

-- Create enum for proficiency levels
CREATE TYPE proficiency_level AS ENUM ('developmental', 'satisfactory', 'mastery');

-- Create enum for question types
CREATE TYPE question_type AS ENUM ('mcq', 'short_answer', 'true_false');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student Learning Outcomes (SLOs) table
CREATE TABLE public.slos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  target_proficiency NUMERIC(5,2) NOT NULL DEFAULT 85.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_target_proficiency CHECK (target_proficiency >= 0 AND target_proficiency <= 100)
);

-- Assessments table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_marks NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  correct_answer TEXT NOT NULL,
  max_marks NUMERIC(5,2) NOT NULL,
  options JSONB, -- For MCQ options: ["Option A", "Option B", "Option C", "Option D"]
  order_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_marks CHECK (max_marks > 0)
);

-- Question-SLO Mapping table (junction table)
CREATE TABLE public.question_slo_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  slo_id UUID NOT NULL REFERENCES public.slos(id) ON DELETE CASCADE,
  mark_contribution NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_contribution CHECK (mark_contribution > 0),
  UNIQUE(question_id, slo_id)
);

-- Test Attempts table
CREATE TABLE public.test_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_possible NUMERIC(10,2) NOT NULL,
  answers JSONB NOT NULL, -- Stores student answers
  slo_breakdown JSONB, -- Stores SLO-wise performance for this attempt
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SLO Performance Tracking table (cumulative)
CREATE TABLE public.slo_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slo_id UUID NOT NULL REFERENCES public.slos(id) ON DELETE CASCADE,
  total_marks_earned NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_marks_attempted NUMERIC(10,2) NOT NULL DEFAULT 0,
  current_proficiency_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  current_level proficiency_level NOT NULL DEFAULT 'developmental',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, slo_id),
  CONSTRAINT valid_performance CHECK (total_marks_earned <= total_marks_attempted)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_slo_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slo_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for subjects
CREATE POLICY "Everyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Teachers can create subjects" ON public.subjects FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can update own subjects" ON public.subjects FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete own subjects" ON public.subjects FOR DELETE USING (teacher_id = auth.uid());

-- RLS Policies for SLOs
CREATE POLICY "Everyone can view SLOs" ON public.slos FOR SELECT USING (true);
CREATE POLICY "Teachers can create SLOs" ON public.slos FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.subjects s 
    INNER JOIN public.profiles p ON s.teacher_id = p.id
    WHERE s.id = subject_id AND p.id = auth.uid() AND p.role = 'teacher'
  )
);
CREATE POLICY "Teachers can update SLOs for own subjects" ON public.slos FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.subjects WHERE id = subject_id AND teacher_id = auth.uid()
  )
);
CREATE POLICY "Teachers can delete SLOs" ON public.slos FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.subjects WHERE id = subject_id AND teacher_id = auth.uid()
  )
);

-- RLS Policies for assessments
CREATE POLICY "Everyone can view published assessments" ON public.assessments FOR SELECT USING (is_published = true OR teacher_id = auth.uid());
CREATE POLICY "Teachers can create assessments" ON public.assessments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can update own assessments" ON public.assessments FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can delete own assessments" ON public.assessments FOR DELETE USING (teacher_id = auth.uid());

-- RLS Policies for questions
CREATE POLICY "Users can view questions of accessible assessments" ON public.questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.assessments WHERE id = assessment_id AND (is_published = true OR teacher_id = auth.uid())
  )
);
CREATE POLICY "Teachers can create questions" ON public.questions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assessments WHERE id = assessment_id AND teacher_id = auth.uid()
  )
);
CREATE POLICY "Teachers can update questions" ON public.questions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.assessments WHERE id = assessment_id AND teacher_id = auth.uid()
  )
);
CREATE POLICY "Teachers can delete questions" ON public.questions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.assessments WHERE id = assessment_id AND teacher_id = auth.uid()
  )
);

-- RLS Policies for question_slo_mappings
CREATE POLICY "Users can view SLO mappings" ON public.question_slo_mappings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.questions q
    INNER JOIN public.assessments a ON q.assessment_id = a.id
    WHERE q.id = question_id AND (a.is_published = true OR a.teacher_id = auth.uid())
  )
);
CREATE POLICY "Teachers can create SLO mappings" ON public.question_slo_mappings FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.questions q
    INNER JOIN public.assessments a ON q.assessment_id = a.id
    WHERE q.id = question_id AND a.teacher_id = auth.uid()
  )
);
CREATE POLICY "Teachers can update SLO mappings" ON public.question_slo_mappings FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.questions q
    INNER JOIN public.assessments a ON q.assessment_id = a.id
    WHERE q.id = question_id AND a.teacher_id = auth.uid()
  )
);
CREATE POLICY "Teachers can delete SLO mappings" ON public.question_slo_mappings FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.questions q
    INNER JOIN public.assessments a ON q.assessment_id = a.id
    WHERE q.id = question_id AND a.teacher_id = auth.uid()
  )
);

-- RLS Policies for test_attempts
CREATE POLICY "Students can view own attempts" ON public.test_attempts FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can view attempts for own assessments" ON public.test_attempts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.assessments WHERE id = assessment_id AND teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can create own attempts" ON public.test_attempts FOR INSERT WITH CHECK (student_id = auth.uid());

-- RLS Policies for slo_performance
CREATE POLICY "Students can view own performance" ON public.slo_performance FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Teachers can view student performance" ON public.slo_performance FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "System can manage SLO performance" ON public.slo_performance FOR ALL USING (true);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'),
    COALESCE(new.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();