import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

export async function POST() {
  try {
    const supabase = createClient()
    
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'migrations', '001-multi-user-support.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split SQL statements (basic split on semicolon and newline)
    const statements = migrationSQL
      .split(';\n')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '')
    
    console.log(`Executing ${statements.length} migration statements...`)
    
    const results = []
    
    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 100)}...`)
        
        // Execute the statement
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`Error executing statement: ${statement.substring(0, 100)}...`)
          console.error(error)
          results.push({
            statement: statement.substring(0, 100) + '...',
            success: false,
            error: error.message
          })
        } else {
          results.push({
            statement: statement.substring(0, 100) + '...',
            success: true
          })
        }
      } catch (err) {
        console.error(`Exception executing statement: ${statement.substring(0, 100)}...`)
        console.error(err)
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    
    return NextResponse.json({
      success: errorCount === 0,
      message: `Migration completed: ${successCount} successful, ${errorCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: errorCount
      }
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to run migration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Alternative approach using direct SQL execution
export async function GET() {
  try {
    const migrationPath = path.join(process.cwd(), 'migrations', '001-multi-user-support.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    return NextResponse.json({
      message: 'Migration SQL ready',
      sql: migrationSQL,
      instructions: `
        To run this migration:
        1. Copy the SQL from the 'sql' field below
        2. Go to your Supabase dashboard
        3. Navigate to SQL Editor
        4. Paste and execute the SQL
        
        Or use the POST method to this endpoint to auto-execute (requires exec_sql function).
      `
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to read migration file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}