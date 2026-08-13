'use client';

import { useForms, useCreateForm } from '@/hooks/useForms';
import { FormCard } from '@/components/dashboard/FormCard';
import { Plus, Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });
  const { data: forms, isLoading, error } = useForms();
  const createForm = useCreateForm();
  const router = useRouter();

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const handleCreateForm = async () => {
    try {
      const newForm = await createForm.mutateAsync({
        title: 'New Form',
        description: 'Please describe your form.',
        is_published: false,
      });
      router.push(`/forms/${newForm.id}/builder`);
    } catch (err) {
      console.error('Failed to create form:', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              My Workspace
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {session?.user?.name === "Guest" ? "Guest Mode (Shared)" : session?.user?.email}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <LogOut size={16} />
              Sign out
            </button>
            <button
              onClick={handleCreateForm}
              disabled={createForm.isPending}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {createForm.isPending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Plus size={18} />
              )}
              Create form
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            Failed to load forms. Please try again.
          </div>
        ) : forms && forms.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {forms.map((form) => (
              <FormCard key={form.id} form={form} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-24 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-900">
              <Plus className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              No forms yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Get started by creating your first form to start collecting responses.
            </p>
            <button
              onClick={handleCreateForm}
              className="mt-6 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Create your first form
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
