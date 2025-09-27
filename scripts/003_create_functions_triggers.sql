-- Create functions and triggers for the Base44 app

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON public.time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    entity_name,
    metadata
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_entity_type,
    p_entity_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to calculate task progress based on subtasks
CREATE OR REPLACE FUNCTION calculate_task_progress(task_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_subtasks INTEGER;
  completed_subtasks INTEGER;
  progress INTEGER;
BEGIN
  -- Count total subtasks
  SELECT COUNT(*) INTO total_subtasks
  FROM public.tasks
  WHERE parent_task_id = task_id;
  
  -- If no subtasks, return current progress
  IF total_subtasks = 0 THEN
    SELECT COALESCE(
      (SELECT tasks.progress FROM public.tasks WHERE id = task_id), 0
    ) INTO progress;
    RETURN progress;
  END IF;
  
  -- Count completed subtasks
  SELECT COUNT(*) INTO completed_subtasks
  FROM public.tasks
  WHERE parent_task_id = task_id AND status = 'done';
  
  -- Calculate progress percentage
  progress := ROUND((completed_subtasks::DECIMAL / total_subtasks::DECIMAL) * 100);
  
  RETURN progress;
END;
$$;

-- Function to update project progress based on tasks
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  project_id UUID;
  total_tasks INTEGER;
  completed_tasks INTEGER;
  new_progress INTEGER;
BEGIN
  -- Get project ID from the task
  IF TG_OP = 'DELETE' THEN
    project_id := OLD.project_id;
  ELSE
    project_id := NEW.project_id;
  END IF;
  
  -- Count total tasks for the project
  SELECT COUNT(*) INTO total_tasks
  FROM public.tasks
  WHERE tasks.project_id = project_id;
  
  -- Count completed tasks
  SELECT COUNT(*) INTO completed_tasks
  FROM public.tasks
  WHERE tasks.project_id = project_id AND status = 'done';
  
  -- Calculate new progress
  IF total_tasks = 0 THEN
    new_progress := 0;
  ELSE
    new_progress := ROUND((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100);
  END IF;
  
  -- Update project progress
  UPDATE public.projects
  SET progress = new_progress
  WHERE id = project_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger to update project progress when tasks change
CREATE TRIGGER update_project_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_progress();
