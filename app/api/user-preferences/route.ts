import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // For now, return default preferences since we're not using real authentication
    // TODO: Implement proper user-based preferences when authentication is added
    const defaultPreferences = {
      show_deleted_jobs: false,
      show_finished_jobs: true,
      add_to_calendar_default: false,
      jobs_view_mode: 'list',
      default_status_filter: 'all',
      default_client_filter: 'all'
    };
    
    // Try to get from localStorage-like storage (we'll use a simple in-memory store)
    // This could be enhanced to use a database for system-wide preferences
    return NextResponse.json(defaultPreferences);
  } catch (error) {
    console.error('Error in user preferences GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const allowedFields = [
      'show_deleted_jobs',
      'show_finished_jobs', 
      'add_to_calendar_default',
      'jobs_view_mode',
      'default_status_filter',
      'default_client_filter'
    ];

    const updateData = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = body[key];
        return obj;
      }, {});

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid preferences provided' }, { status: 400 });
    }

    // For now, just return the updated data as confirmation
    // TODO: Store in a persistent way when authentication is implemented
    console.log('User preferences updated:', updateData);
    
    return NextResponse.json(updateData);
  } catch (error) {
    console.error('Error in user preferences POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
