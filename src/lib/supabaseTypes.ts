export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'accountant';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: UserRole;
          school_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role: UserRole;
          school_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      students: {
        Row: {
          id: string;
          name: string;
          roll_no: string;
          class: string;
          section: string;
          dob: string;
          gender: string;
          blood_group: string;
          guardian_name: string;
          guardian_phone: string;
          guardian_email: string;
          address: string;
          photo_url: string | null;
          admission_date: string;
          fee_status: 'Paid' | 'Partially Paid' | 'Due' | 'Overdue';
          attendance_percent: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['students']['Insert']>;
      };
      teachers: {
        Row: {
          id: string;
          name: string;
          employee_id: string;
          subjects: string[];
          class_assigned: string;
          qualification: string;
          phone: string;
          email: string;
          join_date: string;
          salary: number;
          status: 'Active' | 'On Leave' | 'Inactive';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['teachers']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['teachers']['Insert']>;
      };
      attendance_records: {
        Row: {
          id: string;
          student_id: string;
          class: string;
          section: string;
          date: string;
          status: 'Present' | 'Absent' | 'Late';
          marked_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attendance_records']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['attendance_records']['Insert']>;
      };
      marks: {
        Row: {
          id: string;
          student_id: string;
          exam: string;
          subject: string;
          max_marks: number;
          scored: number;
          grade: string;
          updated_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['marks']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['marks']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          type: 'fee' | 'attendance' | 'announcement' | 'leave' | 'general';
          title: string;
          message: string;
          time: string;
          read: boolean;
          for_role: string[];
          target_email: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      holidays: {
        Row: {
          id: string;
          title: string;
          date: string;
          end_date: string | null;
          type: 'National' | 'Festival' | 'School Event' | 'Vacation' | 'Optional';
          audience: 'All' | 'Students' | 'Teachers' | 'Staff';
          note: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['holidays']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['holidays']['Insert']>;
      };
      fees: {
        Row: {
          student_id: string;
          fee_structure: { item: string; amount: number }[];
          total_amount: number;
          amount_paid: number;
          balance: number;
          due_date: string;
          status: 'Paid' | 'Partially Paid' | 'Due' | 'Overdue';
          payment_history: {
            id: string;
            date: string;
            amount: number;
            mode: string;
            receiptNo: string;
            recordedBy: string;
            remarks?: string;
          }[];
          updated_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['fees']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['fees']['Insert']>;
      };
      exams: {
        Row: {
          id: string;
          name: string;
          class: string;
          section: string | null;
          subject: string | null;
          date: string;
          time: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exams']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['exams']['Insert']>;
      };
      timetable_entries: {
        Row: {
          id: string;
          class: string;
          section: string;
          day: string;
          period: number;
          time: string;
          subject: string;
          teacher: string;
          is_break: boolean;
          updated_by: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['timetable_entries']['Row'], 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['timetable_entries']['Insert']>;
      };
      leaves: {
        Row: {
          id: string;
          applicant_id: string;
          applicant_name: string;
          applicant_role: string;
          leave_type: string;
          from_date: string;
          to_date: string;
          days: number;
          reason: string;
          status: 'Pending' | 'Approved' | 'Rejected';
          applied_on: string;
          remarks: string | null;
          updated_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['leaves']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['leaves']['Insert']>;
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          audience: string[];
          priority: 'Normal' | 'Important' | 'Urgent';
          posted_by: string;
          posted_at: string;
          pinned: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
      };
    };
  };
};
