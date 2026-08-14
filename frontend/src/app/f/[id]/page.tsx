'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useForm } from '@/hooks/useForms';
import { Loader2, ArrowDown, ArrowUp, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Question, Answer, ResponseCreate } from '@/types/form';
import { formsService } from '@/services/api';

export default function PublicFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const formId = parseInt(params.id as string, 10);
  
  const { data: form, isLoading, error } = useForm(formId);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Setup keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in a long text area, unless it's Ctrl+Enter
      if (e.key === 'Enter' && e.target instanceof HTMLTextAreaElement && !e.ctrlKey && !e.metaKey) {
        return;
      }
      
      if (e.key === 'Enter') {
        e.preventDefault();
        if (form && currentSlideIndex === form.questions.length) {
          const btn = document.getElementById('submit-response-btn');
          if (btn) btn.click();
        } else {
          handleNext();
        }
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevious();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, form, answers]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Form not found.</p>
      </div>
    );
  }

  if (!form.is_published && !isPreview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Form is not published</h1>
        <p className="text-zinc-400">The creator has not published this form yet.</p>
      </div>
    );
  }

  const sortedQuestions = [...form.questions].sort((a, b) => a.order - b.order);
  const totalSlides = sortedQuestions.length + 1; // +1 for the submit/summary screen
  const isSummaryScreen = currentSlideIndex === sortedQuestions.length;
  const currentQuestion = !isSummaryScreen ? sortedQuestions[currentSlideIndex] : null;

  const handleNext = () => {
    if (isSummaryScreen) return;
    
    // Validate current question
    if (currentQuestion?.is_required) {
      const answer = answers[currentQuestion.id!];
      if (!answer || !answer.text_value || answer.text_value.trim() === '') {
        setValidationError('This question is required.');
        return;
      }
    }
    
    setValidationError('');
    setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  };

  const handlePrevious = () => {
    setValidationError('');
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
  };

  const setAnswerValue = (questionId: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { question_id: questionId, text_value: value }
    }));
    setValidationError('');
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const answersList = Object.values(answers);
      const payload: ResponseCreate = { answers: answersList };
      await formsService.submitResponse(formId, payload);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit form:', err);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress percentage
  const progress = ((currentSlideIndex) / totalSlides) * 100;

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500">
            <Check size={48} className="text-black" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Thank you!</h1>
          <p className="text-xl text-zinc-400">Your response has been recorded.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black font-sans overflow-hidden">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-zinc-200 dark:bg-zinc-800 z-50">
        <div 
          className="h-full bg-zinc-900 dark:bg-white transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12 relative w-full h-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!isSummaryScreen && currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full"
            >
              <div className="flex items-start gap-4 mb-8">
                <span className="text-xl font-bold text-zinc-400 dark:text-zinc-500 mt-1">
                  {currentSlideIndex + 1} <ArrowRight className="inline h-4 w-4" />
                </span>
                <div className="flex-1">
                  <h2 className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">
                    {currentQuestion.text}
                    {currentQuestion.is_required && <span className="text-red-500 ml-2">*</span>}
                  </h2>
                </div>
              </div>

              <div className="ml-10">
                {currentQuestion.type === 'text' && (
                  <input
                    type="text"
                    value={answers[currentQuestion.id!]?.text_value || ''}
                    onChange={(e) => setAnswerValue(currentQuestion.id!, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full border-b border-zinc-300 bg-transparent py-3 text-2xl outline-none placeholder:text-zinc-300 focus:border-zinc-900 dark:border-zinc-700 dark:placeholder:text-zinc-600 dark:focus:border-white text-zinc-900 dark:text-zinc-50 transition-colors"
                    autoFocus
                  />
                )}

                {currentQuestion.type === 'long_text' && (
                  <textarea
                    value={answers[currentQuestion.id!]?.text_value || ''}
                    onChange={(e) => setAnswerValue(currentQuestion.id!, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full resize-none border-b border-zinc-300 bg-transparent py-3 text-2xl outline-none placeholder:text-zinc-300 focus:border-zinc-900 dark:border-zinc-700 dark:placeholder:text-zinc-600 dark:focus:border-white text-zinc-900 dark:text-zinc-50 transition-colors"
                    rows={4}
                    autoFocus
                  />
                )}

                {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') && (
                  <div className="flex flex-col gap-3">
                    {currentQuestion.choices?.sort((a, b) => a.order - b.order).map((choice, idx) => {
                      let isSelected = false;
                      if (currentQuestion.type === 'multiple_choice') {
                        try {
                          const arr = JSON.parse(answers[currentQuestion.id!]?.text_value || '[]');
                          isSelected = arr.includes(choice.text); // Still uses text to identify for simplicity in responses
                        } catch(e) {
                          isSelected = false;
                        }
                      } else {
                        isSelected = answers[currentQuestion.id!]?.text_value === choice.text;
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (currentQuestion.type === 'multiple_choice') {
                              let arr: string[] = [];
                              try {
                                arr = JSON.parse(answers[currentQuestion.id!]?.text_value || '[]');
                              } catch(e) {}
                              
                              if (arr.includes(choice.text)) {
                                arr = arr.filter(t => t !== choice.text);
                              } else {
                                arr.push(choice.text);
                              }
                              setAnswerValue(currentQuestion.id!, JSON.stringify(arr));
                            } else {
                              setAnswerValue(currentQuestion.id!, choice.text);
                              setTimeout(() => handleNext(), 300);
                            }
                          }}
                          className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                            isSelected
                              ? 'border-zinc-900 bg-zinc-100 dark:border-white dark:bg-zinc-800'
                              : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900'
                          }`}
                        >
                          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs font-bold ${
                            isSelected 
                              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black' 
                              : 'border-zinc-300 text-zinc-500 dark:border-zinc-700'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-xl text-zinc-900 dark:text-zinc-100 font-medium">
                            {choice.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-8 ml-10 flex items-center gap-4">
                <button
                  onClick={handleNext}
                  className="rounded-lg bg-zinc-900 px-6 py-3 text-lg font-bold text-white transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-black"
                >
                  OK <Check size={18} className="inline ml-1 mb-0.5" />
                </button>
                <span className="text-sm text-zinc-400">press <span className="font-bold">Enter ↵</span></span>
              </div>
              
              {validationError && (
                <div className="mt-4 ml-10 rounded-md bg-red-50 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {validationError}
                </div>
              )}
            </motion.div>
          )}

          {isSummaryScreen && (
             <motion.div
              key="summary"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full text-center"
            >
              <h2 className="text-4xl font-bold mb-8 text-zinc-900 dark:text-zinc-50">
                Ready to submit?
              </h2>
              <button
                id="submit-response-btn"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-xl bg-zinc-900 px-8 py-4 text-2xl font-bold text-white transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-black disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin inline mr-2" /> : null}
                Submit Responses
              </button>
              <div className="mt-6">
                 <span className="text-sm text-zinc-400">press <span className="font-bold">Enter ↵</span></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Controls (Bottom Right) */}
      <div className="fixed bottom-6 right-6 flex items-center overflow-hidden rounded-lg bg-zinc-900 text-white shadow-lg dark:bg-white dark:text-black">
        <button 
          onClick={handlePrevious}
          disabled={currentSlideIndex === 0}
          className="flex items-center justify-center p-3 hover:bg-zinc-800 disabled:opacity-30 dark:hover:bg-zinc-200 transition-colors"
        >
          <ArrowUp size={20} />
        </button>
        <div className="w-px h-6 bg-zinc-700 dark:bg-zinc-300" />
        <button 
          onClick={handleNext}
          disabled={isSummaryScreen}
          className="flex items-center justify-center p-3 hover:bg-zinc-800 disabled:opacity-30 dark:hover:bg-zinc-200 transition-colors"
        >
          <ArrowDown size={20} />
        </button>
      </div>
    </div>
  );
}

function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
