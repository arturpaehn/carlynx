import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    const { userType, userId, email } = await request.json()

    console.log('Received request:', { userType, userId, email })

    if (!userType || !['individual', 'dealer'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // First, check if profile exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, user_type')
      .eq('user_id', userId)
      .maybeSingle()

    console.log('Profile check result:', { existingProfile, checkError })

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking profile:', checkError)
      return NextResponse.json(
        { error: 'Failed to check profile' },
        { status: 500 }
      )
    }

    if (existingProfile) {
      // Profile exists, update it
      console.log('Updating existing profile...')
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({ user_type: userType })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error updating user type:', updateError)
        return NextResponse.json(
          { error: 'Failed to update user type', details: updateError },
          { status: 500 }
        )
      }
      
      console.log('Profile updated successfully!')
    } else {
      // Profile doesn't exist yet, create it with user_type
      console.log('Creating new profile...')
      const { error: insertError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: userId,
          email: email,
          user_type: userType
        })

      if (insertError) {
        console.error('Error creating user profile:', insertError)
        return NextResponse.json(
          { error: 'Failed to create user profile', details: insertError },
          { status: 500 }
        )
      }
      
      console.log('Profile created successfully!')
    }

    return NextResponse.json({ success: true, action: existingProfile ? 'updated' : 'created' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
