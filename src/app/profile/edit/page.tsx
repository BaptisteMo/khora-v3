'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function ProfileEditPage() {
  const { user, profile, updateProfile } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState(profile?.username || '');
  const [avatarUrl] = useState(profile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user || !profile) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    let uploadedAvatarUrl = avatarUrl;

    // Upload avatar if a new file is selected
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `avatars/${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatar-profile')
        .upload(filePath, avatarFile, { upsert: true });
      if (uploadError) {
        setError('Failed to upload avatar.');
        setLoading(false);
        return;
      }
      const { data } = supabase.storage.from('avatar-profile').getPublicUrl(filePath);
      uploadedAvatarUrl = data.publicUrl;
    }

    // Update profile
    try {
      await updateProfile({ username, avatar_url: uploadedAvatarUrl });
      setSuccess('Profile updated successfully!');
      // Ensure the new profile is reflected everywhere
      if (typeof window !== 'undefined') {
        window.location.href = '/profile';
      }
      // Alternatively, if you want to avoid a full reload and have a fetchUserProfile or refreshProfile in context, call it here.
      // await refreshProfile();
      // setTimeout(() => router.push('/profile'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Utility: Generate a color from a string (username)
  function stringToColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 60%, 60%)`;
    return color;
  }

  return (
    <div className="flex min-h-screen flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white shadow rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative h-24 w-24 mb-2">
              {previewUrl || avatarUrl ? (
                <Image
                  src={previewUrl || avatarUrl}
                  alt="Avatar Preview"
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div
                  className="h-24 w-24 rounded-full flex items-center justify-center text-3xl text-white font-bold"
                  style={{ background: stringToColor(profile.username) }}
                >
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {avatarFile ? 'Change Avatar' : 'Upload Avatar'}
            </button>
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={24}
              pattern="^[a-zA-Z0-9_]+$"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">3-24 characters, letters, numbers, and underscores only.</p>
          </div>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">{error}</div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">{success}</div>}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 