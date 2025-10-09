'use server';

import { auth } from '~/server/auth';
import { headers } from 'next/headers';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';

export async function createUser(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Check if the current user is an admin
  if (!session?.user) {
    return { success: false, message: 'You must be logged in' };
  }

  const currentUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user.email),
    columns: {
      isAdmin: true
    }
  });

  if (!currentUser?.isAdmin) {
    return { success: false, message: 'Only admins can create users' };
  }

  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const uploadPermission = formData.get('uploadPermission') === 'true';
    const isAdmin = formData.get('isAdmin') === 'true';

    // Use BetterAuth's signUp method to create user with hashed password
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (result.error) {
      return { success: false, message: result.error.message };
    }

    // Update the user with custom permissions
    if (result.data?.user) {
      await db.update(users)
        .set({
          uploadPermission,
          isAdmin,
          emailVerified: true // Auto-verify admin-created users
        })
        .where((t, { eq }) => eq(t.id, result.data.user.id));
    }

    return {
      success: true,
      message: `User ${name} created successfully`,
      userId: result.data?.user.id
    };
  } catch (error) {
    console.error('Failed to create user:', error);
    return {
      success: false,
      message: 'Failed to create user. Please try again.'
    };
  }
}
