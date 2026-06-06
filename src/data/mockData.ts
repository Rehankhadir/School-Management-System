// Mock data for School Management System

export const mockUsers = [
  { id: 'u001', name: 'Ravi Kumar', email: 'admin@school.com', password: 'admin123', role: 'admin' as const, avatar: null, schoolName: 'Sunrise Public School' },
  { id: 'u002', name: 'Priya Sharma', email: 'teacher@school.com', password: 'teacher123', role: 'teacher' as const, avatar: null, schoolName: 'Sunrise Public School' },
  { id: 'u003', name: 'Arjun Singh', email: 'student@school.com', password: 'student123', role: 'student' as const, avatar: null, schoolName: 'Sunrise Public School' },
  { id: 'u004', name: 'Meera Devi', email: 'parent@school.com', password: 'parent123', role: 'parent' as const, avatar: null, schoolName: 'Sunrise Public School' },
  { id: 'u005', name: 'Suresh Gupta', email: 'accountant@school.com', password: 'account123', role: 'accountant' as const, avatar: null, schoolName: 'Sunrise Public School' },
];

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'accountant';

export const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
export const sections = ['A', 'B', 'C', 'D'];
export const subjects = ['Mathematics', 'Science', 'Hindi', 'English', 'Social Studies', 'Computer Science', 'Physical Education', 'Sanskrit'];
export const paymentModes = ['Cash', 'Online Transfer', 'Cheque', 'DD'];

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
  photo: string | null;
  admissionDate: string;
  feeStatus: 'Paid' | 'Partially Paid' | 'Due' | 'Overdue';
  attendancePercent: number;
}

export const students: Student[] = [
  { id: 's001', name: 'Arjun Singh', rollNo: '101', class: '9', section: 'A', dob: '2010-03-15', gender: 'Male', bloodGroup: 'B+', guardianName: 'Rajesh Singh', guardianPhone: '9876543210', guardianEmail: 'rajesh@gmail.com', address: '12, MG Road, Delhi', photo: null, admissionDate: '2022-04-01', feeStatus: 'Paid', attendancePercent: 92 },
  { id: 's002', name: 'Priya Patel', rollNo: '102', class: '9', section: 'A', dob: '2010-07-22', gender: 'Female', bloodGroup: 'A+', guardianName: 'Vikram Patel', guardianPhone: '9876543211', guardianEmail: 'vikram@gmail.com', address: '45, Nehru Nagar, Mumbai', photo: null, admissionDate: '2022-04-01', feeStatus: 'Due', attendancePercent: 88 },
  { id: 's003', name: 'Rohan Sharma', rollNo: '103', class: '9', section: 'A', dob: '2010-01-10', gender: 'Male', bloodGroup: 'O+', guardianName: 'Sunil Sharma', guardianPhone: '9876543212', guardianEmail: 'sunil@gmail.com', address: '78, Gandhi Road, Jaipur', photo: null, admissionDate: '2022-04-01', feeStatus: 'Paid', attendancePercent: 95 },
  { id: 's004', name: 'Ananya Gupta', rollNo: '104', class: '9', section: 'B', dob: '2010-05-18', gender: 'Female', bloodGroup: 'AB+', guardianName: 'Amit Gupta', guardianPhone: '9876543213', guardianEmail: 'amit@gmail.com', address: '23, Lajpat Nagar, Delhi', photo: null, admissionDate: '2022-04-01', feeStatus: 'Overdue', attendancePercent: 78 },
  { id: 's005', name: 'Karan Mehta', rollNo: '105', class: '9', section: 'B', dob: '2010-09-30', gender: 'Male', bloodGroup: 'B-', guardianName: 'Deepak Mehta', guardianPhone: '9876543214', guardianEmail: 'deepak@gmail.com', address: '56, Civil Lines, Lucknow', photo: null, admissionDate: '2022-04-01', feeStatus: 'Partially Paid', attendancePercent: 85 },
  { id: 's006', name: 'Sneha Reddy', rollNo: '201', class: '10', section: 'A', dob: '2009-11-12', gender: 'Female', bloodGroup: 'A-', guardianName: 'Venkat Reddy', guardianPhone: '9876543215', guardianEmail: 'venkat@gmail.com', address: '89, Banjara Hills, Hyderabad', photo: null, admissionDate: '2021-04-01', feeStatus: 'Paid', attendancePercent: 97 },
  { id: 's007', name: 'Aditya Verma', rollNo: '202', class: '10', section: 'A', dob: '2009-04-25', gender: 'Male', bloodGroup: 'O-', guardianName: 'Manoj Verma', guardianPhone: '9876543216', guardianEmail: 'manoj@gmail.com', address: '34, Gomti Nagar, Lucknow', photo: null, admissionDate: '2021-04-01', feeStatus: 'Due', attendancePercent: 90 },
  { id: 's008', name: 'Kavya Iyer', rollNo: '203', class: '10', section: 'A', dob: '2009-08-08', gender: 'Female', bloodGroup: 'B+', guardianName: 'Srinivas Iyer', guardianPhone: '9876543217', guardianEmail: 'srinivas@gmail.com', address: '67, Adyar, Chennai', photo: null, admissionDate: '2021-04-01', feeStatus: 'Paid', attendancePercent: 93 },
  { id: 's009', name: 'Rahul Joshi', rollNo: '204', class: '10', section: 'B', dob: '2009-02-14', gender: 'Male', bloodGroup: 'AB-', guardianName: 'Prakash Joshi', guardianPhone: '9876543218', guardianEmail: 'prakash@gmail.com', address: '12, Shivaji Nagar, Pune', photo: null, admissionDate: '2021-04-01', feeStatus: 'Overdue', attendancePercent: 72 },
  { id: 's010', name: 'Ishita Das', rollNo: '205', class: '10', section: 'B', dob: '2009-06-20', gender: 'Female', bloodGroup: 'A+', guardianName: 'Soumya Das', guardianPhone: '9876543219', guardianEmail: 'soumya@gmail.com', address: '45, Salt Lake, Kolkata', photo: null, admissionDate: '2021-04-01', feeStatus: 'Paid', attendancePercent: 91 },
  { id: 's011', name: 'Vivaan Kumar', rollNo: '301', class: '8', section: 'A', dob: '2011-12-05', gender: 'Male', bloodGroup: 'O+', guardianName: 'Rajiv Kumar', guardianPhone: '9876543220', guardianEmail: 'rajiv@gmail.com', address: '78, Sector 15, Noida', photo: null, admissionDate: '2023-04-01', feeStatus: 'Paid', attendancePercent: 89 },
  { id: 's012', name: 'Diya Nair', rollNo: '302', class: '8', section: 'A', dob: '2011-10-18', gender: 'Female', bloodGroup: 'B+', guardianName: 'Krishnan Nair', guardianPhone: '9876543221', guardianEmail: 'krishnan@gmail.com', address: '23, Ernakulam, Kochi', photo: null, admissionDate: '2023-04-01', feeStatus: 'Due', attendancePercent: 94 },
  { id: 's013', name: 'Aarav Malhotra', rollNo: '303', class: '8', section: 'B', dob: '2011-07-30', gender: 'Male', bloodGroup: 'A+', guardianName: 'Sanjay Malhotra', guardianPhone: '9876543222', guardianEmail: 'sanjay@gmail.com', address: '56, Model Town, Delhi', photo: null, admissionDate: '2023-04-01', feeStatus: 'Partially Paid', attendancePercent: 82 },
  { id: 's014', name: 'Myra Banerjee', rollNo: '304', class: '8', section: 'B', dob: '2011-03-22', gender: 'Female', bloodGroup: 'O-', guardianName: 'Arnab Banerjee', guardianPhone: '9876543223', guardianEmail: 'arnab@gmail.com', address: '89, Park Street, Kolkata', photo: null, admissionDate: '2023-04-01', feeStatus: 'Paid', attendancePercent: 96 },
  { id: 's015', name: 'Reyansh Agarwal', rollNo: '305', class: '8', section: 'A', dob: '2011-09-14', gender: 'Male', bloodGroup: 'AB+', guardianName: 'Nitin Agarwal', guardianPhone: '9876543224', guardianEmail: 'nitin@gmail.com', address: '34, Civil Lines, Agra', photo: null, admissionDate: '2023-04-01', feeStatus: 'Overdue', attendancePercent: 68 },
  { id: 's016', name: 'Saanvi Chopra', rollNo: '401', class: '7', section: 'A', dob: '2012-01-28', gender: 'Female', bloodGroup: 'B-', guardianName: 'Rahul Chopra', guardianPhone: '9876543225', guardianEmail: 'rchopra@gmail.com', address: '67, Sector 22, Chandigarh', photo: null, admissionDate: '2023-04-01', feeStatus: 'Paid', attendancePercent: 91 },
  { id: 's017', name: 'Vihaan Saxena', rollNo: '402', class: '7', section: 'A', dob: '2012-04-16', gender: 'Male', bloodGroup: 'A+', guardianName: 'Alok Saxena', guardianPhone: '9876543226', guardianEmail: 'alok@gmail.com', address: '12, Hazratganj, Lucknow', photo: null, admissionDate: '2023-04-01', feeStatus: 'Due', attendancePercent: 87 },
  { id: 's018', name: 'Aanya Kapoor', rollNo: '403', class: '7', section: 'B', dob: '2012-06-09', gender: 'Female', bloodGroup: 'O+', guardianName: 'Vikrant Kapoor', guardianPhone: '9876543227', guardianEmail: 'vikrant@gmail.com', address: '45, Jubilee Hills, Hyderabad', photo: null, admissionDate: '2023-04-01', feeStatus: 'Paid', attendancePercent: 93 },
  { id: 's019', name: 'Kabir Thakur', rollNo: '404', class: '7', section: 'B', dob: '2012-11-03', gender: 'Male', bloodGroup: 'B+', guardianName: 'Mahesh Thakur', guardianPhone: '9876543228', guardianEmail: 'mahesh@gmail.com', address: '78, Mall Road, Shimla', photo: null, admissionDate: '2023-04-01', feeStatus: 'Partially Paid', attendancePercent: 80 },
  { id: 's020', name: 'Kiara Bajaj', rollNo: '405', class: '7', section: 'A', dob: '2012-08-21', gender: 'Female', bloodGroup: 'A-', guardianName: 'Rahul Bajaj', guardianPhone: '9876543229', guardianEmail: 'rbajaj@gmail.com', address: '23, Koregaon Park, Pune', photo: null, admissionDate: '2023-04-01', feeStatus: 'Paid', attendancePercent: 95 },
  { id: 's021', name: 'Dhruv Pandey', rollNo: '501', class: '11', section: 'A', dob: '2008-05-12', gender: 'Male', bloodGroup: 'O+', guardianName: 'Ashok Pandey', guardianPhone: '9876543230', guardianEmail: 'ashok@gmail.com', address: '56, Varanasi', photo: null, admissionDate: '2020-04-01', feeStatus: 'Paid', attendancePercent: 88 },
  { id: 's022', name: 'Riya Mishra', rollNo: '502', class: '11', section: 'A', dob: '2008-09-25', gender: 'Female', bloodGroup: 'B+', guardianName: 'Vinod Mishra', guardianPhone: '9876543231', guardianEmail: 'vinod@gmail.com', address: '89, Indira Nagar, Bangalore', photo: null, admissionDate: '2020-04-01', feeStatus: 'Due', attendancePercent: 90 },
  { id: 's023', name: 'Arnav Tiwari', rollNo: '503', class: '11', section: 'B', dob: '2008-02-18', gender: 'Male', bloodGroup: 'AB+', guardianName: 'Ramesh Tiwari', guardianPhone: '9876543232', guardianEmail: 'ramesh@gmail.com', address: '34, Arera Colony, Bhopal', photo: null, admissionDate: '2020-04-01', feeStatus: 'Paid', attendancePercent: 94 },
  { id: 's024', name: 'Navya Shetty', rollNo: '504', class: '11', section: 'B', dob: '2008-07-07', gender: 'Female', bloodGroup: 'A+', guardianName: 'Mohan Shetty', guardianPhone: '9876543233', guardianEmail: 'mohan@gmail.com', address: '67, Mangalore', photo: null, admissionDate: '2020-04-01', feeStatus: 'Overdue', attendancePercent: 75 },
  { id: 's025', name: 'Yash Chauhan', rollNo: '601', class: '12', section: 'A', dob: '2007-11-30', gender: 'Male', bloodGroup: 'O-', guardianName: 'Dinesh Chauhan', guardianPhone: '9876543234', guardianEmail: 'dinesh@gmail.com', address: '12, Dehradun', photo: null, admissionDate: '2019-04-01', feeStatus: 'Paid', attendancePercent: 91 },
  { id: 's026', name: 'Aisha Khan', rollNo: '602', class: '12', section: 'A', dob: '2007-04-14', gender: 'Female', bloodGroup: 'B-', guardianName: 'Irfan Khan', guardianPhone: '9876543235', guardianEmail: 'irfan@gmail.com', address: '45, Old City, Hyderabad', photo: null, admissionDate: '2019-04-01', feeStatus: 'Paid', attendancePercent: 96 },
  { id: 's027', name: 'Siddharth Rao', rollNo: '603', class: '12', section: 'B', dob: '2007-08-22', gender: 'Male', bloodGroup: 'A+', guardianName: 'Venkatesh Rao', guardianPhone: '9876543236', guardianEmail: 'venkatesh@gmail.com', address: '78, JP Nagar, Bangalore', photo: null, admissionDate: '2019-04-01', feeStatus: 'Partially Paid', attendancePercent: 83 },
  { id: 's028', name: 'Tara Menon', rollNo: '604', class: '12', section: 'B', dob: '2007-01-19', gender: 'Female', bloodGroup: 'O+', guardianName: 'Suresh Menon', guardianPhone: '9876543237', guardianEmail: 'smenon@gmail.com', address: '23, Thiruvananthapuram', photo: null, admissionDate: '2019-04-01', feeStatus: 'Due', attendancePercent: 89 },
  { id: 's029', name: 'Om Prakash', rollNo: '605', class: '12', section: 'A', dob: '2007-06-05', gender: 'Male', bloodGroup: 'AB-', guardianName: 'Hari Prakash', guardianPhone: '9876543238', guardianEmail: 'hari@gmail.com', address: '56, Patna', photo: null, admissionDate: '2019-04-01', feeStatus: 'Paid', attendancePercent: 92 },
  { id: 's030', name: 'Zara Hussain', rollNo: '606', class: '12', section: 'B', dob: '2007-10-11', gender: 'Female', bloodGroup: 'B+', guardianName: 'Farhan Hussain', guardianPhone: '9876543239', guardianEmail: 'farhan@gmail.com', address: '89, Lucknow', photo: null, admissionDate: '2019-04-01', feeStatus: 'Paid', attendancePercent: 98 },
];

export interface Teacher {
  id: string;
  name: string;
  employeeId: string;
  subjects: string[];
  classAssigned: string;
  qualification: string;
  phone: string;
  email: string;
  joinDate: string;
  salary: number;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export const teachers: Teacher[] = [
  { id: 't001', name: 'Priya Sharma', employeeId: 'EMP001', subjects: ['Mathematics'], classAssigned: '9A', qualification: 'M.Sc Mathematics', phone: '9876500001', email: 'priya@school.com', joinDate: '2018-06-15', salary: 45000, status: 'Active' },
  { id: 't002', name: 'Amit Verma', employeeId: 'EMP002', subjects: ['Science'], classAssigned: '10A', qualification: 'M.Sc Physics', phone: '9876500002', email: 'amit@school.com', joinDate: '2019-04-01', salary: 42000, status: 'Active' },
  { id: 't003', name: 'Sunita Devi', employeeId: 'EMP003', subjects: ['Hindi', 'Sanskrit'], classAssigned: '8A', qualification: 'M.A Hindi', phone: '9876500003', email: 'sunita@school.com', joinDate: '2017-07-20', salary: 40000, status: 'Active' },
  { id: 't004', name: 'Rajesh Khanna', employeeId: 'EMP004', subjects: ['English'], classAssigned: '9B', qualification: 'M.A English', phone: '9876500004', email: 'rajesh@school.com', joinDate: '2020-01-10', salary: 38000, status: 'Active' },
  { id: 't005', name: 'Meena Kumari', employeeId: 'EMP005', subjects: ['Social Studies'], classAssigned: '7A', qualification: 'M.A History', phone: '9876500005', email: 'meena@school.com', joinDate: '2016-08-01', salary: 43000, status: 'Active' },
  { id: 't006', name: 'Vijay Kumar', employeeId: 'EMP006', subjects: ['Computer Science'], classAssigned: '11A', qualification: 'M.Tech CS', phone: '9876500006', email: 'vijay@school.com', joinDate: '2021-03-15', salary: 48000, status: 'Active' },
  { id: 't007', name: 'Anita Desai', employeeId: 'EMP007', subjects: ['Mathematics'], classAssigned: '10B', qualification: 'M.Sc Mathematics', phone: '9876500007', email: 'anita@school.com', joinDate: '2019-06-01', salary: 44000, status: 'On Leave' },
  { id: 't008', name: 'Suresh Raina', employeeId: 'EMP008', subjects: ['Physical Education'], classAssigned: '12A', qualification: 'B.P.Ed', phone: '9876500008', email: 'suresh@school.com', joinDate: '2018-04-01', salary: 35000, status: 'Active' },
  { id: 't009', name: 'Kavitha Nair', employeeId: 'EMP009', subjects: ['Science'], classAssigned: '8B', qualification: 'M.Sc Chemistry', phone: '9876500009', email: 'kavitha@school.com', joinDate: '2020-07-15', salary: 41000, status: 'Active' },
  { id: 't010', name: 'Ramesh Yadav', employeeId: 'EMP010', subjects: ['English', 'Hindi'], classAssigned: '7B', qualification: 'M.A English', phone: '9876500010', email: 'ramesh@school.com', joinDate: '2017-01-10', salary: 39000, status: 'Active' },
  { id: 't011', name: 'Pooja Bhatt', employeeId: 'EMP011', subjects: ['Social Studies'], classAssigned: '11B', qualification: 'M.A Political Science', phone: '9876500011', email: 'pooja@school.com', joinDate: '2022-04-01', salary: 37000, status: 'Active' },
  { id: 't012', name: 'Deepak Hooda', employeeId: 'EMP012', subjects: ['Sanskrit', 'Hindi'], classAssigned: '12B', qualification: 'M.A Sanskrit', phone: '9876500012', email: 'deepak@school.com', joinDate: '2015-06-20', salary: 46000, status: 'Active' },
];

export const monthlyFeeCollection = [
  { month: 'Jan', amount: 485000 },
  { month: 'Feb', amount: 520000 },
  { month: 'Mar', amount: 498000 },
  { month: 'Apr', amount: 610000 },
  { month: 'May', amount: 575000 },
  { month: 'Jun', amount: 420000 },
  { month: 'Jul', amount: 390000 },
  { month: 'Aug', amount: 545000 },
  { month: 'Sep', amount: 580000 },
  { month: 'Oct', amount: 620000 },
  { month: 'Nov', amount: 555000 },
  { month: 'Dec', amount: 490000 },
];

export const weeklyAttendance = [
  { day: 'Mon', percentage: 94 },
  { day: 'Tue', percentage: 92 },
  { day: 'Wed', percentage: 96 },
  { day: 'Thu', percentage: 89 },
  { day: 'Fri', percentage: 91 },
  { day: 'Sat', percentage: 85 },
];

export interface Fee {
  studentId: string;
  feeStructure: { item: string; amount: number }[];
  totalAmount: number;
  amountPaid: number;
  balance: number;
  dueDate: string;
  status: 'Paid' | 'Partially Paid' | 'Due' | 'Overdue';
  paymentHistory: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  mode: string;
  receiptNo: string;
  recordedBy: string;
  remarks?: string;
}

export const fees: Fee[] = students.map((s, i) => ({
  studentId: s.id,
  feeStructure: [
    { item: 'Tuition Fee', amount: 25000 },
    { item: 'Transport Fee', amount: 8000 },
    { item: 'Library Fee', amount: 2000 },
    { item: 'Lab Fee', amount: 3000 },
    { item: 'Activity Fee', amount: 2000 },
  ],
  totalAmount: 40000,
  amountPaid: s.feeStatus === 'Paid' ? 40000 : s.feeStatus === 'Partially Paid' ? 25000 : s.feeStatus === 'Due' ? 0 : 0,
  balance: s.feeStatus === 'Paid' ? 0 : s.feeStatus === 'Partially Paid' ? 15000 : 40000,
  dueDate: '2025-03-31',
  status: s.feeStatus,
  paymentHistory: s.feeStatus === 'Paid' ? [
    { id: `pay-${i}-1`, date: '2025-01-15', amount: 40000, mode: 'Online Transfer', receiptNo: `RCP-2025-${String(i + 1).padStart(4, '0')}`, recordedBy: 'Admin' }
  ] : s.feeStatus === 'Partially Paid' ? [
    { id: `pay-${i}-1`, date: '2025-01-10', amount: 15000, mode: 'Cash', receiptNo: `RCP-2025-${String(i + 1).padStart(4, '0')}`, recordedBy: 'Admin' },
    { id: `pay-${i}-2`, date: '2025-02-15', amount: 10000, mode: 'Online Transfer', receiptNo: `RCP-2025-${String(i + 30).padStart(4, '0')}`, recordedBy: 'Admin' }
  ] : [],
}));

export interface LeaveRecord {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
  remarks?: string;
}

export const leaves: LeaveRecord[] = [
  { id: 'l001', applicantId: 't001', applicantName: 'Priya Sharma', applicantRole: 'Teacher', leaveType: 'Sick', fromDate: '2025-02-10', toDate: '2025-02-12', days: 3, reason: 'Fever and cold', status: 'Approved', appliedOn: '2025-02-09' },
  { id: 'l002', applicantId: 't002', applicantName: 'Amit Verma', applicantRole: 'Teacher', leaveType: 'Casual', fromDate: '2025-02-15', toDate: '2025-02-16', days: 2, reason: 'Family function', status: 'Pending', appliedOn: '2025-02-13' },
  { id: 'l003', applicantId: 's001', applicantName: 'Arjun Singh', applicantRole: 'Student', leaveType: 'Sick', fromDate: '2025-02-18', toDate: '2025-02-19', days: 2, reason: 'Stomach ache', status: 'Approved', appliedOn: '2025-02-17' },
  { id: 'l004', applicantId: 't003', applicantName: 'Sunita Devi', applicantRole: 'Teacher', leaveType: 'Emergency', fromDate: '2025-02-20', toDate: '2025-02-22', days: 3, reason: 'Family emergency', status: 'Approved', appliedOn: '2025-02-19' },
  { id: 'l005', applicantId: 's005', applicantName: 'Karan Mehta', applicantRole: 'Student', leaveType: 'Casual', fromDate: '2025-02-25', toDate: '2025-02-25', days: 1, reason: 'Personal work', status: 'Pending', appliedOn: '2025-02-23' },
  { id: 'l006', applicantId: 't006', applicantName: 'Vijay Kumar', applicantRole: 'Teacher', leaveType: 'Sick', fromDate: '2025-03-01', toDate: '2025-03-03', days: 3, reason: 'Dental surgery', status: 'Pending', appliedOn: '2025-02-28' },
  { id: 'l007', applicantId: 's010', applicantName: 'Ishita Das', applicantRole: 'Student', leaveType: 'Other', fromDate: '2025-03-05', toDate: '2025-03-06', days: 2, reason: 'Exam preparation at home', status: 'Rejected', appliedOn: '2025-03-03', remarks: 'Not a valid reason' },
  { id: 'l008', applicantId: 't008', applicantName: 'Suresh Raina', applicantRole: 'Teacher', leaveType: 'Casual', fromDate: '2025-03-10', toDate: '2025-03-12', days: 3, reason: 'Travel for sports event', status: 'Approved', appliedOn: '2025-03-08' },
  { id: 'l009', applicantId: 's015', applicantName: 'Reyansh Agarwal', applicantRole: 'Student', leaveType: 'Sick', fromDate: '2025-03-14', toDate: '2025-03-15', days: 2, reason: 'High fever', status: 'Approved', appliedOn: '2025-03-13' },
  { id: 'l010', applicantId: 't010', applicantName: 'Ramesh Yadav', applicantRole: 'Teacher', leaveType: 'Emergency', fromDate: '2025-03-18', toDate: '2025-03-20', days: 3, reason: 'Parent hospitalized', status: 'Pending', appliedOn: '2025-03-17' },
];

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string[];
  priority: 'Normal' | 'Important' | 'Urgent';
  postedBy: string;
  postedAt: string;
  pinned: boolean;
}

export const announcements: Announcement[] = [
  { id: 'a001', title: 'Annual Day Celebration', body: 'Annual Day will be celebrated on March 25th. All students must participate in cultural events. Parents are invited.', audience: ['All'], priority: 'Important', postedBy: 'Admin', postedAt: '2025-02-20T10:00:00', pinned: true },
  { id: 'a002', title: 'Parent-Teacher Meeting', body: 'PTM scheduled for February 28th from 10 AM to 1 PM. All parents must attend with their child\'s report card.', audience: ['Parents', 'Teachers'], priority: 'Important', postedBy: 'Admin', postedAt: '2025-02-18T09:00:00', pinned: false },
  { id: 'a003', title: 'Science Exhibition', body: 'Science exhibition will be held on March 5th. Students from classes 8-12 can submit their projects.', audience: ['Students', 'Teachers'], priority: 'Normal', postedBy: 'Admin', postedAt: '2025-02-15T14:00:00', pinned: false },
  { id: 'a004', title: 'Fee Payment Reminder', body: 'Last date for fee payment is March 31st. Late fee of ₹500 will be charged after due date.', audience: ['Parents', 'Students'], priority: 'Urgent', postedBy: 'Admin', postedAt: '2025-02-25T11:00:00', pinned: true },
  { id: 'a005', title: 'Sports Day', body: 'Annual Sports Day on March 15th. Students should report at 7 AM in sports uniform.', audience: ['All'], priority: 'Normal', postedBy: 'Admin', postedAt: '2025-02-22T08:00:00', pinned: false },
  { id: 'a006', title: 'Holiday Notice', body: 'School will remain closed on March 8th (Maha Shivaratri) and March 14th (Holi).', audience: ['All'], priority: 'Important', postedBy: 'Admin', postedAt: '2025-02-26T10:30:00', pinned: false },
  { id: 'a007', title: 'Library Books Return', body: 'All library books must be returned by March 20th. Fine of ₹10/day for late returns.', audience: ['Students'], priority: 'Normal', postedBy: 'Admin', postedAt: '2025-02-28T09:30:00', pinned: false },
  { id: 'a008', title: 'Staff Meeting', body: 'All teaching staff must attend the meeting on March 1st at 3:30 PM in the conference room.', audience: ['Teachers'], priority: 'Important', postedBy: 'Admin', postedAt: '2025-02-27T16:00:00', pinned: false },
  { id: 'a009', title: 'Exam Schedule Released', body: 'Final exam schedule has been released. Exams start from April 1st. Check notice board for details.', audience: ['Students', 'Parents', 'Teachers'], priority: 'Urgent', postedBy: 'Admin', postedAt: '2025-03-01T10:00:00', pinned: true },
  { id: 'a010', title: 'Bus Route Change', body: 'Bus route 5 (Nehru Nagar) has been modified. New pickup time: 7:15 AM instead of 7:30 AM.', audience: ['Parents', 'Students'], priority: 'Normal', postedBy: 'Admin', postedAt: '2025-03-02T08:00:00', pinned: false },
];

export interface Notification {
  id: string;
  type: 'fee' | 'attendance' | 'announcement' | 'leave' | 'general';
  title: string;
  message: string;
  time: string;
  read: boolean;
  forRole: string[];
}

export const notifications: Notification[] = [
  { id: 'n001', type: 'fee', title: 'Fee Payment Received', message: 'Payment of ₹40,000 received from Arjun Singh (Class 9A)', time: '2025-03-01T10:30:00', read: false, forRole: ['admin', 'accountant'] },
  { id: 'n002', type: 'attendance', title: 'Low Attendance Alert', message: 'Reyansh Agarwal (Class 8A) attendance dropped below 75%', time: '2025-03-01T09:00:00', read: false, forRole: ['admin', 'teacher'] },
  { id: 'n003', type: 'leave', title: 'Leave Request', message: 'Amit Verma has applied for 2 days casual leave', time: '2025-02-28T14:00:00', read: false, forRole: ['admin'] },
  { id: 'n004', type: 'announcement', title: 'New Announcement', message: 'Exam Schedule Released - Final exams start April 1st', time: '2025-03-01T10:00:00', read: true, forRole: ['admin', 'teacher', 'student', 'parent'] },
  { id: 'n005', type: 'fee', title: 'Fee Overdue', message: '5 students have overdue fee payments for this quarter', time: '2025-02-28T08:00:00', read: false, forRole: ['admin', 'accountant'] },
  { id: 'n006', type: 'attendance', title: 'Attendance Submitted', message: 'Class 9A attendance marked for today by Priya Sharma', time: '2025-03-01T08:45:00', read: true, forRole: ['admin'] },
  { id: 'n007', type: 'general', title: 'System Update', message: 'System maintenance scheduled for Sunday 2 AM - 4 AM', time: '2025-02-27T16:00:00', read: true, forRole: ['admin'] },
  { id: 'n008', type: 'leave', title: 'Leave Approved', message: 'Your sick leave from Feb 10-12 has been approved', time: '2025-02-10T11:00:00', read: true, forRole: ['teacher'] },
  { id: 'n009', type: 'fee', title: 'Fee Reminder', message: 'Fee payment of ₹40,000 is due by March 31st', time: '2025-03-01T07:00:00', read: false, forRole: ['student', 'parent'] },
  { id: 'n010', type: 'attendance', title: 'Absent Today', message: 'Your child was marked absent today in Class 9B', time: '2025-03-01T09:30:00', read: false, forRole: ['parent'] },
  { id: 'n011', type: 'announcement', title: 'Annual Day Reminder', message: 'Annual Day celebration on March 25th. Rehearsals start next week.', time: '2025-02-26T10:00:00', read: false, forRole: ['student', 'teacher'] },
  { id: 'n012', type: 'general', title: 'Report Card Ready', message: 'Your mid-term report card is available for download', time: '2025-02-25T14:00:00', read: true, forRole: ['student', 'parent'] },
];

export interface TimetableEntry {
  period: number;
  time: string;
  subject: string;
  teacher: string;
  isBreak?: boolean;
}

export interface DayTimetable {
  day: string;
  periods: TimetableEntry[];
}

const periodTimes = [
  '8:00 - 8:45', '8:45 - 9:30', '9:30 - 10:15', '10:15 - 10:30',
  '10:30 - 11:15', '11:15 - 12:00', '12:00 - 12:45', '12:45 - 1:30',
  '1:30 - 2:15', '2:15 - 3:00', '3:00 - 3:45'
];

export const timetable: Record<string, DayTimetable[]> = {
  '9A': [
    { day: 'Monday', periods: [
      { period: 1, time: periodTimes[0], subject: 'Mathematics', teacher: 'Priya Sharma' },
      { period: 2, time: periodTimes[1], subject: 'English', teacher: 'Rajesh Khanna' },
      { period: 3, time: periodTimes[2], subject: 'Science', teacher: 'Amit Verma' },
      { period: 4, time: periodTimes[3], subject: 'Break', teacher: '', isBreak: true },
      { period: 5, time: periodTimes[4], subject: 'Hindi', teacher: 'Sunita Devi' },
      { period: 6, time: periodTimes[5], subject: 'Social Studies', teacher: 'Meena Kumari' },
      { period: 7, time: periodTimes[6], subject: 'Computer Science', teacher: 'Vijay Kumar' },
      { period: 8, time: periodTimes[7], subject: 'Lunch', teacher: '', isBreak: true },
      { period: 9, time: periodTimes[8], subject: 'Physical Education', teacher: 'Suresh Raina' },
      { period: 10, time: periodTimes[9], subject: 'Sanskrit', teacher: 'Deepak Hooda' },
      { period: 11, time: periodTimes[10], subject: 'Mathematics', teacher: 'Priya Sharma' },
    ]},
    { day: 'Tuesday', periods: [
      { period: 1, time: periodTimes[0], subject: 'Science', teacher: 'Amit Verma' },
      { period: 2, time: periodTimes[1], subject: 'Mathematics', teacher: 'Priya Sharma' },
      { period: 3, time: periodTimes[2], subject: 'English', teacher: 'Rajesh Khanna' },
      { period: 4, time: periodTimes[3], subject: 'Break', teacher: '', isBreak: true },
      { period: 5, time: periodTimes[4], subject: 'Computer Science', teacher: 'Vijay Kumar' },
      { period: 6, time: periodTimes[5], subject: 'Hindi', teacher: 'Sunita Devi' },
      { period: 7, time: periodTimes[6], subject: 'Social Studies', teacher: 'Meena Kumari' },
      { period: 8, time: periodTimes[7], subject: 'Lunch', teacher: '', isBreak: true },
      { period: 9, time: periodTimes[8], subject: 'Sanskrit', teacher: 'Deepak Hooda' },
      { period: 10, time: periodTimes[9], subject: 'Physical Education', teacher: 'Suresh Raina' },
      { period: 11, time: periodTimes[10], subject: 'Science', teacher: 'Amit Verma' },
    ]},
    { day: 'Wednesday', periods: [
      { period: 1, time: periodTimes[0], subject: 'English', teacher: 'Rajesh Khanna' },
      { period: 2, time: periodTimes[1], subject: 'Science', teacher: 'Amit Verma' },
      { period: 3, time: periodTimes[2], subject: 'Mathematics', teacher: 'Priya Sharma' },
      { period: 4, time: periodTimes[3], subject: 'Break', teacher: '', isBreak: true },
      { period: 5, time: periodTimes[4], subject: 'Social Studies', teacher: 'Meena Kumari' },
      { period: 6, time: periodTimes[5], subject: 'Computer Science', teacher: 'Vijay Kumar' },
      { period: 7, time: periodTimes[6], subject: 'Hindi', teacher: 'Sunita Devi' },
      { period: 8, time: periodTimes[7], subject: 'Lunch', teacher: '', isBreak: true },
      { period: 9, time: periodTimes[8], subject: 'Mathematics', teacher: 'Priya Sharma' },
      { period: 10, time: periodTimes[9], subject: 'Sanskrit', teacher: 'Deepak Hooda' },
      { period: 11, time: periodTimes[10], subject: 'Physical Education', teacher: 'Suresh Raina' },
    ]},
    { day: 'Thursday', periods: [
      { period: 1, time: periodTimes[0], subject: 'Hindi', teacher: 'Sunita Devi' },
      { period: 2, time: periodTimes[1], subject: 'Mathematics', teacher: 'Priya Sharma' },
      { period: 3, time: periodTimes[2], subject: 'Social Studies', teacher: 'Meena Kumari' },
      { period: 4, time: periodTimes[3], subject: 'Break', teacher: '', isBreak: true },
      { period: 5, time: periodTimes[4], subject: 'Science', teacher: 'Amit Verma' },
      { period: 6, time: periodTimes[5], subject: 'English', teacher: 'Rajesh Khanna' },
      { period: 7, time: periodTimes[6], subject: 'Sanskrit', teacher: 'Deepak Hooda' },
      { period: 8, time: periodTimes[7], subject: 'Lunch', teacher: '', isBreak: true },
      { period: 9, time: periodTimes[8], subject: 'Computer Science', teacher: 'Vijay Kumar' },
      { period: 10, time: periodTimes[9], subject: 'Physical Education', teacher: 'Suresh Raina' },
      { period: 11, time: periodTimes[10], subject: 'Mathematics', teacher: 'Priya Sharma' },
    ]},
    { day: 'Friday', periods: [
      { period: 1, time: periodTimes[0], subject: 'Social Studies', teacher: 'Meena Kumari' },
      { period: 2, time: periodTimes[1], subject: 'English', teacher: 'Rajesh Khanna' },
      { period: 3, time: periodTimes[2], subject: 'Hindi', teacher: 'Sunita Devi' },
      { period: 4, time: periodTimes[3], subject: 'Break', teacher: '', isBreak: true },
      { period: 5, time: periodTimes[4], subject: 'Mathematics', teacher: 'Priya Sharma' },
      { period: 6, time: periodTimes[5], subject: 'Science', teacher: 'Amit Verma' },
      { period: 7, time: periodTimes[6], subject: 'Physical Education', teacher: 'Suresh Raina' },
      { period: 8, time: periodTimes[7], subject: 'Lunch', teacher: '', isBreak: true },
      { period: 9, time: periodTimes[8], subject: 'Computer Science', teacher: 'Vijay Kumar' },
      { period: 10, time: periodTimes[9], subject: 'Sanskrit', teacher: 'Deepak Hooda' },
      { period: 11, time: periodTimes[10], subject: 'English', teacher: 'Rajesh Khanna' },
    ]},
    { day: 'Saturday', periods: [
      { period: 1, time: periodTimes[0], subject: 'Mathematics', teacher: 'Priya Sharma' },
      { period: 2, time: periodTimes[1], subject: 'Science', teacher: 'Amit Verma' },
      { period: 3, time: periodTimes[2], subject: 'Computer Science', teacher: 'Vijay Kumar' },
      { period: 4, time: periodTimes[3], subject: 'Break', teacher: '', isBreak: true },
      { period: 5, time: periodTimes[4], subject: 'English', teacher: 'Rajesh Khanna' },
      { period: 6, time: periodTimes[5], subject: 'Hindi', teacher: 'Sunita Devi' },
      { period: 7, time: periodTimes[6], subject: 'Social Studies', teacher: 'Meena Kumari' },
      { period: 8, time: periodTimes[7], subject: 'Lunch', teacher: '', isBreak: true },
      { period: 9, time: periodTimes[8], subject: 'Physical Education', teacher: 'Suresh Raina' },
      { period: 10, time: periodTimes[9], subject: 'Mathematics', teacher: 'Priya Sharma' },
      { period: 11, time: periodTimes[10], subject: 'Sanskrit', teacher: 'Deepak Hooda' },
    ]},
  ],
};

export interface MarkEntry {
  studentId: string;
  exam: string;
  subject: string;
  maxMarks: number;
  scored: number;
  grade: string;
}

export const marks: MarkEntry[] = [];

// Generate marks for students in class 9
const examTypes = ['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Exam'];
const subjectsForMarks = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science'];

students.filter(s => s.class === '9').forEach(student => {
  examTypes.forEach(exam => {
    subjectsForMarks.forEach(subject => {
      const maxMarks = exam.includes('Unit') ? 25 : 100;
      const scored = Math.floor(Math.random() * (maxMarks * 0.4)) + Math.floor(maxMarks * 0.5);
      const pct = (scored / maxMarks) * 100;
      let grade = 'F';
      if (pct >= 90) grade = 'A+';
      else if (pct >= 80) grade = 'A';
      else if (pct >= 70) grade = 'B';
      else if (pct >= 60) grade = 'C';
      else if (pct >= 50) grade = 'D';
      marks.push({ studentId: student.id, exam, subject, maxMarks, scored, grade });
    });
  });
});

// Generate marks for class 10 too
students.filter(s => s.class === '10').forEach(student => {
  examTypes.forEach(exam => {
    subjectsForMarks.forEach(subject => {
      const maxMarks = exam.includes('Unit') ? 25 : 100;
      const scored = Math.floor(Math.random() * (maxMarks * 0.4)) + Math.floor(maxMarks * 0.5);
      const pct = (scored / maxMarks) * 100;
      let grade = 'F';
      if (pct >= 90) grade = 'A+';
      else if (pct >= 80) grade = 'A';
      else if (pct >= 70) grade = 'B';
      else if (pct >= 60) grade = 'C';
      else if (pct >= 50) grade = 'D';
      marks.push({ studentId: student.id, exam, subject, maxMarks, scored, grade });
    });
  });
});

// Generate attendance records
export interface AttendanceRecord {
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
}

export const attendanceRecords: AttendanceRecord[] = [];

students.forEach(student => {
  for (let d = 1; d <= 28; d++) {
    const date = `2025-02-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0) continue; // Skip Sundays
    const rand = Math.random();
    let status: 'Present' | 'Absent' | 'Late' = 'Present';
    if (rand > 0.92) status = 'Absent';
    else if (rand > 0.85) status = 'Late';
    attendanceRecords.push({ studentId: student.id, date, status });
  }
});

export const subjectColors: Record<string, string> = {
  'Mathematics': 'bg-blue-100 text-blue-800',
  'Science': 'bg-green-100 text-green-800',
  'English': 'bg-purple-100 text-purple-800',
  'Hindi': 'bg-orange-100 text-orange-800',
  'Social Studies': 'bg-yellow-100 text-yellow-800',
  'Computer Science': 'bg-cyan-100 text-cyan-800',
  'Physical Education': 'bg-red-100 text-red-800',
  'Sanskrit': 'bg-pink-100 text-pink-800',
  'Break': 'bg-gray-100 text-gray-500',
  'Lunch': 'bg-gray-100 text-gray-500',
};
