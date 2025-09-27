-- Seed sample data for the Base44 app
-- This creates sample organizations, projects, and tasks for testing

-- Insert sample organizations
INSERT INTO public.organizations (id, name, description, industry, size, settings) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation', 'Leading technology solutions provider', 'Technology', 'medium', '{"theme": "blue", "timezone": "UTC"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Design Studio Pro', 'Creative design and branding agency', 'Design', 'small', '{"theme": "purple", "timezone": "UTC"}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample projects
INSERT INTO public.projects (id, organization_id, name, description, status, priority, start_date, end_date, budget, color, tags) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Website Redesign', 'Complete overhaul of company website with modern design and improved UX', 'active', 'high', '2024-01-15', '2024-04-15', 50000.00, '#3B82F6', ARRAY['web', 'design', 'frontend']),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Mobile App Development', 'Native mobile application for iOS and Android platforms', 'planning', 'medium', '2024-02-01', '2024-08-01', 120000.00, '#10B981', ARRAY['mobile', 'ios', 'android']),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Brand Identity Refresh', 'Update brand guidelines and create new marketing materials', 'active', 'high', '2024-01-01', '2024-03-31', 25000.00, '#F59E0B', ARRAY['branding', 'design', 'marketing'])
ON CONFLICT (id) DO NOTHING;

-- Insert sample tasks
INSERT INTO public.tasks (id, project_id, title, description, status, priority, type, estimated_hours, due_date, tags, position) VALUES
  -- Website Redesign tasks
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'User Research & Analysis', 'Conduct user interviews and analyze current website performance', 'done', 'high', 'task', 40.0, '2024-02-01', ARRAY['research', 'ux'], 1),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Wireframe Creation', 'Create low-fidelity wireframes for all main pages', 'done', 'high', 'task', 32.0, '2024-02-15', ARRAY['wireframes', 'ux'], 2),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'Visual Design', 'Create high-fidelity mockups and design system', 'in_progress', 'high', 'task', 60.0, '2024-03-01', ARRAY['design', 'ui'], 3),
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 'Frontend Development', 'Implement responsive frontend using React and Tailwind', 'todo', 'high', 'task', 80.0, '2024-03-20', ARRAY['frontend', 'react'], 4),
  ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', 'Content Migration', 'Migrate existing content to new website structure', 'todo', 'medium', 'task', 24.0, '2024-04-01', ARRAY['content', 'migration'], 5),
  
  -- Mobile App Development tasks
  ('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440002', 'Technical Architecture', 'Define app architecture and technology stack', 'todo', 'high', 'epic', 16.0, '2024-02-15', ARRAY['architecture', 'planning'], 1),
  ('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440002', 'UI/UX Design', 'Create mobile app designs and user flows', 'todo', 'high', 'task', 48.0, '2024-03-01', ARRAY['design', 'mobile'], 2),
  ('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440002', 'iOS Development', 'Develop native iOS application', 'todo', 'high', 'feature', 120.0, '2024-06-01', ARRAY['ios', 'swift'], 3),
  
  -- Brand Identity Refresh tasks
  ('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440003', 'Brand Audit', 'Analyze current brand positioning and competitor landscape', 'done', 'high', 'task', 20.0, '2024-01-15', ARRAY['research', 'branding'], 1),
  ('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440003', 'Logo Design', 'Create new logo concepts and variations', 'in_progress', 'high', 'task', 32.0, '2024-02-15', ARRAY['logo', 'design'], 2),
  ('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440003', 'Brand Guidelines', 'Develop comprehensive brand style guide', 'todo', 'medium', 'task', 24.0, '2024-03-01', ARRAY['guidelines', 'branding'], 3)
ON CONFLICT (id) DO NOTHING;

-- Insert sample comments
INSERT INTO public.comments (entity_type, entity_id, content, author_id) VALUES
  ('task', '770e8400-e29b-41d4-a716-446655440003', 'Great progress on the visual design! The color palette looks fantastic.', NULL),
  ('task', '770e8400-e29b-41d4-a716-446655440010', 'Please consider making the logo more scalable for mobile applications.', NULL),
  ('project', '660e8400-e29b-41d4-a716-446655440001', 'Project is progressing well. We might finish ahead of schedule!', NULL)
ON CONFLICT DO NOTHING;

-- Insert sample calendar events
INSERT INTO public.calendar_events (id, title, description, start_time, end_time, event_type, organization_id) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'Design Review Meeting', 'Review website mockups and gather feedback', '2024-03-05 14:00:00+00', '2024-03-05 15:30:00+00', 'meeting', '550e8400-e29b-41d4-a716-446655440001'),
  ('880e8400-e29b-41d4-a716-446655440002', 'Project Kickoff', 'Mobile app development project kickoff meeting', '2024-02-01 10:00:00+00', '2024-02-01 11:00:00+00', 'meeting', '550e8400-e29b-41d4-a716-446655440001'),
  ('880e8400-e29b-41d4-a716-446655440003', 'Brand Presentation', 'Present new brand identity to stakeholders', '2024-03-15 16:00:00+00', '2024-03-15 17:00:00+00', 'meeting', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;
