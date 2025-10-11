'use server';

import { db } from '~/server/db';
import { auth } from '~/server/auth';
import { users, accounts } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { headers } from 'next/headers';
import { hashPassword, verifyPassword } from 'better-auth/crypto';

const ProfileSchema = z.object({
  kindleEmail: z.string().email().optional().or(z.literal(''))
});

export async function updateKindleEmail(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function changePassword(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { success: false, message: 'You must be logged in to change your password' };
  }

  try {
    const parsed = PasswordSchema.parse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword')
    });

    // Get the user's account record with the current password hash
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.userId, session.user.id)
    });

    if (!account?.password) {
      return {
        success: false,
        message: 'No password set for this account'
      };
    }

    // Verify the current password
    const isValid = await verifyPassword({
      hash: account.password,
      password: parsed.currentPassword
    });

    if (!isValid) {
      return {
        success: false,
        message: 'Current password is incorrect'
      };
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(parsed.newPassword);

    // Update the password in the database
    await db.update(accounts)
      .set({
        password: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(accounts.userId, session.user.id));

    return {
      success: true,
      message: 'Your password has been changed successfully'
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0]?.message ?? 'Invalid input'
      };
    }

    console.error('Error changing password:', error);
    return {
      success: false,
      message: 'Failed to change password. Please try again later.'
    };
  }
}