'use server';

import { db } from '~/server/db';
import { auth } from '~/server/auth';
import { users } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const ProfileSchema = z.object({
  kindleEmail: z.string().email().optional().or(z.literal(''))
});

export async function updateKindleEmail(formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, message: 'You must be logged in to update your profile' };
  }
  
  try {
    const parsed = ProfileSchema.parse({
      kindleEmail: formData.get('kindleEmail')
    });
    
    await db.update(users)
      .set({ kindleEmail: parsed.kindleEmail ?? null })
      .where(eq(users.email, session.user.email));
    
    return { 
      success: true, 
      message: 'Your Kindle email has been updated successfully' 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: 'Please enter a valid email address' 
      };
    }
    
    return { 
      success: false, 
      message: 'Failed to update your profile. Please try again later.' 
    };
  }
}

export async function getUserProfile() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return null;
  }
  
  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
    columns: {
      id: true,
      name: true,
      email: true,
      kindleEmail: true
    }
  });
  
  return user;
}