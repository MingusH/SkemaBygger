import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 sekunder timeout
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  error => {
    console.error('API Error:', error.config?.url, error.message);
    return Promise.reject(error);
  }
);

// Add request interceptor for debugging
api.interceptors.request.use(
  config => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Student API
export interface Student {
  id: number;
  fornavn: string;
  efternavn: string;
  email: string;
  foedselsdato: string; // ISO string from backend
  elevnummer: string;
  klasse_id: number;
  aktiv: boolean;
  oprettet_dato: string; // ISO string from backend
}

export interface StudentCreate {
  fornavn: string;
  efternavn: string;
  email: string;
  foedselsdato: string; // YYYY-MM-DD string from date input
  elevnummer: string;
  klasse_id: number;
  aktiv: boolean;
}

export const studentApi = {
  getAll: async (): Promise<Student[]> => {
    const response = await api.get('/students/');
    return response.data;
  },
  
  getById: async (id: number): Promise<Student> => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },
  
  create: async (student: StudentCreate): Promise<Student> => {
    const response = await api.post('/students/', student);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/students/${id}`);
  }
};

// Teacher API
export interface Teacher {
  id: number;
  fornavn: string;
  efternavn: string;
  email: string;
  initialer: string;
  telefon?: string;
  ansat_dato: string; // ISO string from backend
  stilling: string;
  aktiv: boolean;
  oprettet_dato: string; // ISO string from backend
}

export interface TeacherCreate {
  fornavn: string;
  efternavn: string;
  email: string;
  initialer: string;
  telefon?: string;
  ansat_dato: string; // YYYY-MM-DD string from date input
  stilling: string;
  aktiv: boolean;
}

export const teacherApi = {
  getAll: async (): Promise<Teacher[]> => {
    const response = await api.get('/teachers/');
    return response.data;
  },
  
  getById: async (id: number): Promise<Teacher> => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },
  
  create: async (teacher: TeacherCreate): Promise<Teacher> => {
    const response = await api.post('/teachers/', teacher);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/teachers/${id}`);
  }
};

// Classroom API
export interface Classroom {
  id: number;
  name: string;
  start_year: number;
  class_teacher_id?: number;
  room?: string;
  active: boolean;
  created_at: string;
}

export interface ClassroomCreate {
  name: string;
  start_year: number;
  class_teacher_id?: number;
  classroom?: string;
  active: boolean;
}

export const classroomApi = {
  getAll: async (): Promise<Classroom[]> => {
    const response = await api.get('/classrooms/');
    return response.data;
  },
  
  create: async (classroom: ClassroomCreate): Promise<Classroom> => {
    const response = await api.post('/classrooms/', classroom);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/classrooms/${id}`);
  }
};

// Subject API
export interface Subject {
  id: number;
  navn: string;
  kort_navn: string;
  farve: string;
  aktiv: boolean;
  teacher_ids: number[];
}

export interface SubjectCreate {
  navn: string;
  kort_navn: string;
  farve: string;
  aktiv: boolean;
  teacher_ids: number[];
}

export const subjectApi = {
  getAll: async (): Promise<Subject[]> => {
    const response = await api.get('/subjects/');
    return response.data;
  },
  
  create: async (subject: SubjectCreate): Promise<Subject> => {
    const response = await api.post('/subjects/', subject);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  }
};
