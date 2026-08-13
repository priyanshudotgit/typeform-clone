export type QuestionType = 'text' | 'long_text' | 'single_choice' | 'multiple_choice';

export interface QuestionChoice {
  id?: number;
  question_id?: number;
  text: string;
  order: number;
}

export interface Question {
  id?: number;
  form_id?: number;
  text: string;
  type: QuestionType;
  order: number;
  is_required: boolean;
  choices?: QuestionChoice[];
}

export interface Form {
  id: number;
  title: string;
  description?: string;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
  questions: Question[];
}

export interface FormCreate {
  title: string;
  description?: string;
  is_published?: boolean;
  questions?: Question[];
}

export interface Answer {
  id?: number;
  response_id?: number;
  question_id: number;
  text_value?: string;
}

export interface Response {
  id: number;
  form_id: number;
  created_at: string;
  answers: Answer[];
}

export interface ResponseCreate {
  answers: Answer[];
}
