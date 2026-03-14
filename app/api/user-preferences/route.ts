import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const defaultPreferences = {
  show_deleted_jobs: false,
  show_finished_jobs: true,
  add_to_calendar_default: false,
  jobs_view_mode: 'list',
  jobs_sort_by: 'number',
  default_status_filter: 'all',
  default_client_filter: 'all',
};

const allowedFields = Object.keys(defaultPreferences);

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(defaultPreferences);
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('show_deleted_jobs, show_finished_jobs, add_to_calendar_default, jobs_view_mode, jobs_sort_by, default_status_filter, default_client_filter')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      // No row yet — return defaults (row will be created on first POST)
      return NextResponse.json(defaultPreferences);
    }

    return NextResponse.json({ ...defaultPreferences, ...data });
  } catch (error) {
    console.error('Error in user preferences GET:', error);
    return NextResponse.json(defaultPreferences);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid preferences provided' }, { status: 400 });
    }

    // Upsert: create row if it doesn't exist, update if it does
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        { user_id: user.id, ...updateData, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select('show_deleted_jobs, show_finished_jobs, add_to_calendar_default, jobs_view_mode, jobs_sort_by, default_status_filter, default_client_filter')
      .single();

    if (error) {
      console.error('Error upserting preferences:', error);
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in user preferences POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
