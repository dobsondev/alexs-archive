'use server';

import { sendBook } from '~/app/_utils/resend';
import { db } from '~/server/db';
import { auth } from '~/server/auth';
import { redirect } from 'next/navigation';
import { users } from '~/server/db/schema';
import { eq } from 'drizzle-orm';

export async function sendToKindle(title: string, uploadthingUrl: string) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, message: 'You must be logged in to send books to Kindle' };
  }

  if (!title || !uploadthingUrl) {
    return { success: false, message: 'Invalid book information' };
  }
  
  // Get the user's Kindle email
  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
    columns: {
      kindleEmail: true
    }
  });
  
  if (!user?.kindleEmail) {
    return { 
      success: false, 
      message: 'No Kindle email found. Please add your Kindle email in your profile settings.' 
    };
  }
  
  // Send the book
  const result = await sendBook(title, uploadthingUrl, user.kindleEmail);
  
  if (!result) {
    return { 
      success: false, 
      message: 'Failed to send book to Kindle. Please try again later.' 
    };
  }
  
  return { 
    success: true, 
    message: `${title} has been sent to your Kindle (${user.kindleEmail})` 
  };
}