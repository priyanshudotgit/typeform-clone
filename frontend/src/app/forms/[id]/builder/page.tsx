'use client';

import { useForm, useUpdateForm } from '@/hooks/useForms';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save, Eye, Settings, Plus, GripVertical, Trash2, Share2, Copy, X, Check } from 'lucide-react';
import NextLink from 'next/link';
import { useState, useEffect } from 'react';
import { Question, QuestionType, Form as FormType } from '@/types/form';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Item Component ---
function SortableQuestionItem({
  question,
  isActive,
  onClick,
  onDelete
}: {
  question: Question;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id || 0 });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getQuestionIcon = (type: QuestionType) => {
    switch (type) {
      case 'text': return 'Tt';
      case 'long_text': return 'Paragraph';
      case 'single_choice': return '○';
      case 'multiple_choice': return '□';
      default: return '?';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 rounded-xl border p-4 transition-colors cursor-pointer ${
        isActive
          ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-900'
          : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'
      }`}
      onClick={onClick}
    >
      <button
        className="cursor-grab p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        {getQuestionIcon(question.type)}
      </div>

      <div className="flex-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {question.text || 'Empty question'}
        {question.is_required && <span className="ml-1 text-red-500">*</span>}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(question.id || 0);
        }}
        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-600 transition-opacity"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// --- Main Builder Page ---
export default function FormBuilderPage() {
  const params = useParams();
  const formId = parseInt(params.id as string, 10);
  const router = useRouter();

  const { data: form, isLoading, error } = useForm(formId);
  const updateForm = useUpdateForm();

  const [localForm, setLocalForm] = useState<FormType | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync with DB
  useEffect(() => {
    if (form) {
      // Sort questions by order before setting to state
      const sortedForm = {
        ...form,
        questions: [...form.questions].sort((a, b) => a.order - b.order)
      };
      setLocalForm(sortedForm);
      if (sortedForm.questions.length > 0 && !activeQuestionId) {
        setActiveQuestionId(sortedForm.questions[0].id || null);
      }
    }
  }, [form]);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (isLoading || !localForm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-600">Failed to load form.</div>;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalForm((prev) => {
        if (!prev) return prev;
        const oldIndex = prev.questions.findIndex((q) => q.id === active.id);
        const newIndex = prev.questions.findIndex((q) => q.id === over.id);
        
        const newQuestions = arrayMove(prev.questions, oldIndex, newIndex).map((q, idx) => ({
          ...q,
          order: idx
        }));
        
        return { ...prev, questions: newQuestions };
      });
    }
  };

  const handleSave = async () => {
    await updateForm.mutateAsync({
      id: formId,
      data: {
        title: localForm.title,
        description: localForm.description,
        is_published: localForm.is_published,
        questions: localForm.questions,
      }
    });
  };

  const activeQuestion = localForm.questions.find(q => q.id === activeQuestionId);

  const addQuestion = (type: QuestionType) => {
    const tempId = -(Date.now()); // temporary negative ID for new questions
    const newQuestion: Question = {
      id: tempId,
      text: '',
      type,
      order: localForm.questions.length,
      is_required: false,
      choices: type.includes('choice') ? [{ text: 'Option 1', order: 0 }] : []
    };
    
    setLocalForm(prev => {
      if (!prev) return prev;
      return { ...prev, questions: [...prev.questions, newQuestion] };
    });
    setActiveQuestionId(tempId);
  };

  const updateActiveQuestion = (updates: Partial<Question>) => {
    if (!activeQuestionId) return;
    setLocalForm(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map(q => q.id === activeQuestionId ? { ...q, ...updates } : q)
      };
    });
  };

  const deleteQuestion = (id: number) => {
    setLocalForm(prev => {
      if (!prev) return prev;
      const newQuestions = prev.questions.filter(q => q.id !== id).map((q, idx) => ({ ...q, order: idx }));
      return { ...prev, questions: newQuestions };
    });
    if (activeQuestionId === id) {
      setActiveQuestionId(null);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/f/${formId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-black overflow-hidden">
      {/* Navbar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-4">
          <NextLink href="/dashboard" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            <ArrowLeft size={20} />
          </NextLink>
          <input 
            type="text" 
            value={localForm.title}
            onChange={(e) => setLocalForm({ ...localForm, title: e.target.value })}
            className="bg-transparent text-lg font-semibold outline-none text-zinc-900 dark:text-zinc-50 border-b border-transparent hover:border-zinc-300 focus:border-zinc-900 dark:focus:border-white transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Share2 size={18} />
            Share
          </button>
          <NextLink
            href={`/f/${formId}?preview=true`}
            target="_blank"
            className="flex items-center gap-2 rounded-lg p-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Eye size={18} />
            Preview
          </NextLink>
          <button
            onClick={() => setLocalForm({...localForm, is_published: !localForm.is_published})}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              localForm.is_published 
                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400' 
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            {localForm.is_published ? 'Published' : 'Draft'}
          </button>
          <button
            onClick={handleSave}
            disabled={updateForm.isPending}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {updateForm.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar - Question List */}
        <div className="w-72 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex flex-col">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Add Elements</h2>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addQuestion('text')} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-white dark:hover:bg-zinc-900 transition-colors text-xs font-medium text-zinc-600 dark:text-zinc-300">
                <span className="text-lg">Tt</span> Short Text
              </button>
              <button onClick={() => addQuestion('multiple_choice')} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-white dark:hover:bg-zinc-900 transition-colors text-xs font-medium text-zinc-600 dark:text-zinc-300">
                <span className="text-lg">□</span> Choices
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Form Questions</h2>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={localForm.questions.map(q => q.id || 0)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {localForm.questions.map((q) => (
                    <SortableQuestionItem
                      key={q.id}
                      question={q}
                      isActive={activeQuestionId === q.id}
                      onClick={() => setActiveQuestionId(q.id || null)}
                      onDelete={deleteQuestion}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            {localForm.questions.length === 0 && (
              <div className="text-center p-6 text-sm text-zinc-500">
                No questions yet. Add one from above!
              </div>
            )}
          </div>
        </div>

        {/* Center - Live Preview / Editor Canvas */}
        <div className="flex-1 overflow-y-auto bg-zinc-50 p-8 dark:bg-black flex items-center justify-center">
          {activeQuestion ? (
            <div className="w-full max-w-2xl">
              <div className="text-zinc-400 mb-4 text-sm font-medium">Question {activeQuestion.order + 1}</div>
              
              <input
                type="text"
                placeholder="Type your question here..."
                value={activeQuestion.text}
                onChange={(e) => updateActiveQuestion({ text: e.target.value })}
                className="w-full bg-transparent text-3xl font-medium outline-none text-zinc-900 dark:text-zinc-50 placeholder-zinc-300 dark:placeholder-zinc-700 mb-8"
                autoFocus
              />

              {/* Mock input field based on type */}
              {activeQuestion.type === 'text' && (
                <div className="border-b border-zinc-300 dark:border-zinc-700 pb-2 w-full max-w-md">
                  <span className="text-zinc-400 text-lg">Type answer here...</span>
                </div>
              )}
              {activeQuestion.type === 'long_text' && (
                <div className="border-b border-zinc-300 dark:border-zinc-700 pb-8 w-full max-w-md">
                  <span className="text-zinc-400 text-lg">Type a long answer here...</span>
                </div>
              )}
              {activeQuestion.type.includes('choice') && (
                <div className="flex flex-col gap-3 max-w-md">
                  {activeQuestion.choices?.map((choice, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded border border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700">
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) => {
                          const newChoices = [...(activeQuestion.choices || [])];
                          newChoices[idx].text = e.target.value;
                          updateActiveQuestion({ choices: newChoices });
                        }}
                        className="flex-1 bg-transparent border-b border-zinc-200 dark:border-zinc-800 outline-none text-lg text-zinc-900 dark:text-zinc-100 focus:border-zinc-400 transition-colors py-1"
                        placeholder={`Option ${idx + 1}`}
                      />
                      <button 
                        onClick={() => {
                          const newChoices = activeQuestion.choices?.filter((_, i) => i !== idx);
                          updateActiveQuestion({ choices: newChoices });
                        }}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newChoices = [...(activeQuestion.choices || []), { text: `Option ${(activeQuestion.choices?.length || 0) + 1}`, order: activeQuestion.choices?.length || 0 }];
                      updateActiveQuestion({ choices: newChoices });
                    }}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 mt-2"
                  >
                    <Plus size={16} /> Add choice
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-zinc-400 text-center">
              <Settings size={48} className="mx-auto mb-4 opacity-20" />
              <p>Select a question to edit</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Settings */}
        <div className="w-72 shrink-0 border-l border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
            <Settings size={16} /> Question Settings
          </h2>
          
          {activeQuestion ? (
            <div className="flex flex-col gap-6">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Required field</span>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={activeQuestion.is_required}
                    onChange={(e) => updateActiveQuestion({ is_required: e.target.checked })}
                  />
                  <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-zinc-900 dark:peer-checked:bg-white"></div>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Question Type</label>
                <select 
                  value={activeQuestion.type}
                  onChange={(e) => updateActiveQuestion({ type: e.target.value as QuestionType })}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black dark:text-zinc-100"
                >
                  <option value="text">Short Text</option>
                  <option value="long_text">Long Text</option>
                  <option value="single_choice">Single Choice</option>
                  <option value="multiple_choice">Multiple Choice</option>
                </select>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Select a question to view its settings.</p>
          )}
        </div>

      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Share Form</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {!localForm.is_published && (
              <div className="mb-6 rounded-lg bg-amber-50 p-4 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 text-amber-800 dark:text-amber-400 text-sm">
                <strong>Warning:</strong> This form is currently saved as a draft. Users won't be able to view or submit responses until it is published.
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Form Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/f/${formId}`}
                  className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex shrink-0 items-center justify-center rounded-lg bg-zinc-900 p-2.5 text-white hover:bg-zinc-800 transition-colors dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  title="Copy Link"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="rounded-lg bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
