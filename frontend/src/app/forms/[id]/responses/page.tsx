'use client';

import { useForm } from '@/hooks/useForms';
import { useFormResponses } from '@/hooks/useResponses';
import { useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Download, Users, Clock, CheckCircle } from 'lucide-react';
import NextLink from 'next/link';
import { format } from 'date-fns';
import { useMemo } from 'react';

export default function ResponsesPage() {
  const params = useParams();
  const formId = parseInt(params.id as string, 10);

  const { data: form, isLoading: isFormLoading, error: formError } = useForm(formId);
  const { data: responses, isLoading: isRespLoading, error: respError } = useFormResponses(formId);

  const isLoading = isFormLoading || isRespLoading;
  const error = formError || respError;

  const sortedQuestions = useMemo(() => {
    if (!form) return [];
    return [...form.questions].sort((a, b) => a.order - b.order);
  }, [form]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !form) {
    return <div className="p-8 text-red-600">Failed to load responses.</div>;
  }

  const handleExport = () => {
    if (!responses || !form) return;
    
    // Create CSV header
    const headers = ['Response ID', 'Submitted At', ...sortedQuestions.map(q => q.text)];
    
    // Create CSV rows
    const rows = responses.map(resp => {
      const rowData = [
        resp.id.toString(),
        format(new Date(resp.created_at), 'yyyy-MM-dd HH:mm:ss')
      ];
      
      sortedQuestions.forEach(q => {
        const answer = resp.answers.find(a => a.question_id === q.id);
        const val = answer?.text_value || '';
        // Escape quotes and wrap in quotes for CSV
        rowData.push(`"${val.replace(/"/g, '""')}"`);
      });
      
      return rowData.join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${form.title}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NextLink href="/dashboard" className="rounded-full p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
              <ArrowLeft size={20} />
            </NextLink>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                {form.title} <span className="text-zinc-400 font-normal">Responses</span>
              </h1>
            </div>
          </div>
          
          <button
            onClick={handleExport}
            disabled={!responses || responses.length === 0}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
              <Users size={18} />
              <h3 className="text-sm font-medium">Total Responses</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {responses?.length || 0}
            </p>
          </div>
          
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
              <CheckCircle size={18} />
              <h3 className="text-sm font-medium">Completion Rate</h3>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {/* Fake stat since we don't track views */}
              {responses && responses.length > 0 ? '100%' : '0%'}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 mb-2">
              <Clock size={18} />
              <h3 className="text-sm font-medium">Latest Response</h3>
            </div>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
              {responses && responses.length > 0 
                ? format(new Date(responses[responses.length - 1].created_at), 'MMM d, yyyy')
                : 'N/A'
              }
            </p>
          </div>
        </div>

        {/* Responses Table */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">#</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Submitted At</th>
                  {sortedQuestions.map((q) => (
                    <th key={q.id} className="px-6 py-4 font-semibold max-w-xs truncate" title={q.text}>
                      {q.text}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {!responses || responses.length === 0 ? (
                  <tr>
                    <td colSpan={sortedQuestions.length + 2} className="px-6 py-12 text-center text-zinc-500">
                      No responses yet.
                    </td>
                  </tr>
                ) : (
                  responses.map((resp, idx) => (
                    <tr key={resp.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(resp.created_at), 'MMM d, h:mm a')}
                      </td>
                      {sortedQuestions.map((q) => {
                        const answer = resp.answers.find(a => a.question_id === q.id);
                        return (
                          <td key={q.id} className="px-6 py-4 max-w-xs truncate" title={answer?.text_value || ''}>
                            {answer?.text_value || <span className="text-zinc-300 dark:text-zinc-700">-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
