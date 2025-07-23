import { NextResponse } from 'next/server';
import { db } from '~/server/db';
import { auth } from '~/server/auth';
import { users } from '~/server/db/schema';
import { isNotNull } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has upload permission
    const currentUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user.email!),
      columns: {
        uploadPermission: true
      }
    });

    if (!currentUser?.uploadPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch all users with Kindle emails
    const usersWithKindleEmails = await db.query.users.findMany({
      where: isNotNull(users.kindleEmail),
      columns: {
        name: true,
        email: true,
        kindleEmail: true
      }
    });

    return NextResponse.json(usersWithKindleEmails);
  } catch (error) {
    console.error('Failed to fetch users with Kindle emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}