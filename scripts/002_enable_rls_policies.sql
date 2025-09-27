-- Enable Row Level Security (RLS) for all tables
-- This ensures users can only access data they have permission to see

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event_attendees ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizations table policies
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can update organizations" ON public.organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Organization members table policies
CREATE POLICY "Users can view organization members" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage members" ON public.organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Projects table policies
CREATE POLICY "Users can view projects they have access to" ON public.projects
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    ) OR
    id IN (
      SELECT project_id FROM public.project_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project leads and org admins can update projects" ON public.projects
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    ) OR
    id IN (
      SELECT project_id FROM public.project_members 
      WHERE user_id = auth.uid() AND role = 'lead'
    )
  );

CREATE POLICY "Organization members can create projects" ON public.projects
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

-- Project members table policies
CREATE POLICY "Users can view project members" ON public.project_members
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE 
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      ) OR
      id IN (
        SELECT project_id FROM public.project_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Project leads can manage project members" ON public.project_members
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM public.project_members 
      WHERE user_id = auth.uid() AND role = 'lead'
    ) OR
    project_id IN (
      SELECT id FROM public.projects WHERE 
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
      )
    )
  );

-- Tasks table policies
CREATE POLICY "Users can view tasks in accessible projects" ON public.tasks
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE 
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      ) OR
      id IN (
        SELECT project_id FROM public.project_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Project members can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE 
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      ) OR
      id IN (
        SELECT project_id FROM public.project_members 
        WHERE user_id = auth.uid()
      )
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Task assignees and project leads can update tasks" ON public.tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    project_id IN (
      SELECT project_id FROM public.project_members 
      WHERE user_id = auth.uid() AND role = 'lead'
    ) OR
    project_id IN (
      SELECT id FROM public.projects WHERE 
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
      )
    )
  );

-- Task dependencies table policies
CREATE POLICY "Users can view task dependencies" ON public.task_dependencies
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE 
      project_id IN (
        SELECT id FROM public.projects WHERE 
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        ) OR
        id IN (
          SELECT project_id FROM public.project_members 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Project members can manage task dependencies" ON public.task_dependencies
  FOR ALL USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE 
      project_id IN (
        SELECT id FROM public.projects WHERE 
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        ) OR
        id IN (
          SELECT project_id FROM public.project_members 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Comments table policies
CREATE POLICY "Users can view comments on accessible entities" ON public.comments
  FOR SELECT USING (
    (entity_type = 'project' AND entity_id IN (
      SELECT id FROM public.projects WHERE 
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      ) OR
      id IN (
        SELECT project_id FROM public.project_members 
        WHERE user_id = auth.uid()
      )
    )) OR
    (entity_type = 'task' AND entity_id IN (
      SELECT id FROM public.tasks WHERE 
      project_id IN (
        SELECT id FROM public.projects WHERE 
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        ) OR
        id IN (
          SELECT project_id FROM public.project_members 
          WHERE user_id = auth.uid()
        )
      )
    ))
  );

CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Comment authors can update their comments" ON public.comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Comment authors can delete their comments" ON public.comments
  FOR DELETE USING (author_id = auth.uid());

-- Attachments table policies
CREATE POLICY "Users can view attachments on accessible entities" ON public.attachments
  FOR SELECT USING (
    (entity_type = 'project' AND entity_id IN (
      SELECT id FROM public.projects WHERE 
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      ) OR
      id IN (
        SELECT project_id FROM public.project_members 
        WHERE user_id = auth.uid()
      )
    )) OR
    (entity_type = 'task' AND entity_id IN (
      SELECT id FROM public.tasks WHERE 
      project_id IN (
        SELECT id FROM public.projects WHERE 
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        ) OR
        id IN (
          SELECT project_id FROM public.project_members 
          WHERE user_id = auth.uid()
        )
      )
    )) OR
    (entity_type = 'comment' AND entity_id IN (
      SELECT id FROM public.comments WHERE author_id = auth.uid()
    ))
  );

CREATE POLICY "Users can upload attachments" ON public.attachments
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Time entries table policies
CREATE POLICY "Users can view their own time entries" ON public.time_entries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own time entries" ON public.time_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own time entries" ON public.time_entries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own time entries" ON public.time_entries
  FOR DELETE USING (user_id = auth.uid());

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Activity logs table policies
CREATE POLICY "Users can view activity logs for accessible entities" ON public.activity_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    (entity_type = 'project' AND entity_id IN (
      SELECT id FROM public.projects WHERE 
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      ) OR
      id IN (
        SELECT project_id FROM public.project_members 
        WHERE user_id = auth.uid()
      )
    )) OR
    (entity_type = 'task' AND entity_id IN (
      SELECT id FROM public.tasks WHERE 
      project_id IN (
        SELECT id FROM public.projects WHERE 
        organization_id IN (
          SELECT organization_id FROM public.organization_members 
          WHERE user_id = auth.uid()
        ) OR
        id IN (
          SELECT project_id FROM public.project_members 
          WHERE user_id = auth.uid()
        )
      )
    ))
  );

CREATE POLICY "Users can create activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Calendar events table policies
CREATE POLICY "Users can view calendar events in their organization" ON public.calendar_events
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    ) OR
    created_by = auth.uid() OR
    id IN (
      SELECT event_id FROM public.calendar_event_attendees 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create calendar events" ON public.calendar_events
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Event creators can update their events" ON public.calendar_events
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Event creators can delete their events" ON public.calendar_events
  FOR DELETE USING (created_by = auth.uid());

-- Calendar event attendees table policies
CREATE POLICY "Users can view event attendees" ON public.calendar_event_attendees
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.calendar_events WHERE 
      organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      ) OR
      created_by = auth.uid() OR
      id IN (
        SELECT event_id FROM public.calendar_event_attendees 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Event creators can manage attendees" ON public.calendar_event_attendees
  FOR ALL USING (
    event_id IN (
      SELECT id FROM public.calendar_events WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own attendance status" ON public.calendar_event_attendees
  FOR UPDATE USING (user_id = auth.uid());
