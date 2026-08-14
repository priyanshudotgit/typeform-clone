import { Form } from '@/types/form';
import { MoreVertical, Copy, Trash2, Edit3, Link, Users, Calendar } from 'lucide-react';
import NextLink from 'next/link';
import { useState } from 'react';
import { useDeleteForm, useDuplicateForm } from '@/hooks/useForms';
import { format } from 'date-fns';

interface FormCardProps {
  form: Form;
}

export function FormCard({ form }: FormCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const deleteForm = useDeleteForm();
  const duplicateForm = useDuplicateForm();

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await duplicateForm.mutateAsync(form.id);
    setIsMenuOpen(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this form?')) {
      await deleteForm.mutateAsync(form.id);
    }
    setIsMenuOpen(false);
  };

  const formattedDate = form.created_at
    ? format(new Date(form.created_at), 'MMM d, yyyy')
    : 'Unknown Date';

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 h-64">
      {/* Header section */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${form.is_published
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
            >
              {form.is_published ? 'Published' : 'Publish'}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
            {form.title}
          </h3>
          {form.description && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
              {form.description}
            </p>
          )}
        </div>

        {/* Dropdown Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            <MoreVertical size={20} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              <button
                onClick={handleDuplicate}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                <Copy size={16} />
                Duplicate
              </button>
              <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Actions section */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={14} />
            <span>Responses</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
          <NextLink
            href={`/forms/${form.id}/builder`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <Edit3 size={16} />
            Edit
          </NextLink>

          <NextLink
            href={`/forms/${form.id}/responses`}
            className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
            title="View Responses"
          >
            <Users size={18} />
          </NextLink>

          {form.is_published && (
            <NextLink
              href={`/f/${form.id}`}
              target="_blank"
              className="flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
              title="View Public Form"
            >
              <Link size={18} />
            </NextLink>
          )}
        </div>
      </div>

      {/* Overlay for clicking outside menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={(e) => {
            e.preventDefault();
            setIsMenuOpen(false);
          }}
        />
      )}
    </div>
  );
}
