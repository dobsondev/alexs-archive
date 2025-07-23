'use server';

import { sendBook } from '~/app/_utils/resend';
import { db } from '~/server/db';
import { auth } from '~/server/auth';
import { users } from '~/server/db/schema';
import { eq } from 'drizzle-orm';

export async function sendToKindle(title: string, uploadthingUrl: string, targetKindleEmail?: string) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { success: false, message: 'You must be logged in to send books to Kindle' };
  }

  if (!title || !uploadthingUrl) {
    return { success: false, message: 'Invalid book information' };
  }

  let kindleEmailToUse: string;
  let targetUserInfo: string;

  if (targetKindleEmail) {
    // Check if current user has upload permission to send to others
    const currentUser = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
      columns: {
        uploadPermission: true
      }
    });
    
    if (!currentUser?.uploadPermission) {
      return { 
        success: false, 
        message: 'You do not have permission to send books to other users' 
      };
    }

    // Find the target user to get their info for the message
    const targetUser = await db.query.users.findFirst({
      where: eq(users.kindleEmail, targetKindleEmail),
      columns: {
        name: true,
        email: true,
        kindleEmail: true
      }
    });

    if (!targetUser) {
      return { 
        success: false, 
        message: 'Target Kindle email not found' 
      };
    }

    kindleEmailToUse = targetKindleEmail;
    targetUserInfo = `${targetUser.name ?? targetUser.email} (${targetKindleEmail})`;
  } else {
    // Get the current user's Kindle email
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

    kindleEmailToUse = user.kindleEmail;
    targetUserInfo = `your Kindle (${user.kindleEmail})`;
  }
  
  // Send the book
  const result = await sendBook(title, uploadthingUrl, kindleEmailToUse);
  
  if (!result) {
    return { 
      success: false, 
      message: 'Failed to send book to Kindle. Please try again later.' 
    };
  }
  
  return { 
    success: true, 
    message: `${title} has been sent to ${targetUserInfo}` 
  };
}