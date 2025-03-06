'use client';

import { getUserProfile, updateKindleEmail } from '~/app/_actions/profile';
import { useEffect, useState } from 'react';
import Link from "next/link";

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<{
    id: string;
    name: string | null;
    email: string;
    kindleEmail: string | null;
  } | null>(null);
  
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getUserProfile();
      setProfile(data);
      setIsLoading(false);
    };
    
    fetchProfile();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    
    const formData = new FormData(event.currentTarget);
    const result = await updateKindleEmail(formData);
    
    if (result.success) {
      setMessage({ text: result.message, type: 'success' });
      // Update local state with new kindle email
      setProfile(prev => 
        prev ? { ...prev, kindleEmail: formData.get('kindleEmail') as string } : null
      );
    } else {
      setMessage({ text: result.message, type: 'error' });
    }
    
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Profile Settings</h1>

      <div className="mb-6">
        <Link href="/books" className="text-slate-500 text-sm hover:underline">
          ← Back to Books
        </Link>
      </div>
      
      {message && (
        <div className={`mb-6 p-4 rounded ${
          message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
        }`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={profile?.email || ''}
            readOnly
            className="w-full p-2 bg-slate-900 text-slate-500 border border-slate-600 rounded-md"
          />
          <p className="mt-1 text-sm text-slate-400">This is your account email and cannot be changed</p>
        </div>
        
        <div>
          <label htmlFor="kindleEmail" className="block text-sm font-medium mb-2">
            Kindle Email Address
          </label>
          <input
            type="email"
            id="kindleEmail"
            name="kindleEmail"
            defaultValue={profile?.kindleEmail || ''}
            placeholder="your-kindle@kindle.com"
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md"
          />
          <p className="mt-1 text-sm text-slate-400">
            This email is used to send books directly to your Kindle device. 
            You can find your Kindle email in your Amazon account settings.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            In order for automatic sending to work, you will need to add <b><u>kindle@alexs-archive.org</u></b> as one of your approved emails on your account. 
            For more information, please see this link: <a className="hover:underline" href="https://www.amazon.ca/sendtokindle/email" target="_blank">https://www.amazon.ca/sendtokindle/email</a>.
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </main>
  );
}