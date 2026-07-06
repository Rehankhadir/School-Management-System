import { createContext, useContext, useEffect, useState } from 'react';
import { students as mockStudents, type Student } from '@/data/mockData';
import { getStudents } from '@/services/studentService';
import { isSupabaseConfigured } from '@/lib/supabase';

type StudentsContextType = {
  students: Student[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const StudentsContext = createContext<StudentsContextType>({
  students: mockStudents,
  loading: false,
  refresh: async () => {},
});

export function useStudents() {
  return useContext(StudentsContext);
}

export function StudentsProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    if (!isSupabaseConfigured) {
      setStudents(mockStudents);
      return;
    }
    setLoading(true);
    const { data, error } = await getStudents();
    if (!error && data.length > 0) {
      setStudents(data);
    } else {
      setStudents(mockStudents);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <StudentsContext.Provider value={{ students, loading, refresh: fetchStudents }}>
      {children}
    </StudentsContext.Provider>
  );
}
