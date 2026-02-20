import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import ProtectedRoute from "./auth/ProtectedRoute";
import Dashboard from "./dashboard/Dashboard";
import Unauthorized from "./components/Unauthorized";
import AttendancePage from "./attendance/AttendancePage";
import MarkAttendance from "./attendance/MarkAttendance";
import AssessmentsPage from "./assessments/AssessmentsPage";
import UploadMarks from "./assessments/UploadMarks";
import StudentAttendance from "./student/StudentAttendance";
import StudentMarks from "./student/StudentMarks";
import { AuthProvider } from "./auth/AuthContext";

import AdminLayout from './dashboard/admin/AdminLayout';
import AdminDashboard from './dashboard/admin/AdminDashboard';
import UserManagement from './dashboard/admin/UserManagement';
import TeachersManagement from './dashboard/admin/TeachersManagement';
import StudentsManagement from './dashboard/admin/StudentsManagement';
import DeptListPage from './dashboard/admin/DeptListPage';
import StudentListPage from './dashboard/admin/StudentListPage';
import SubjectManagement from './dashboard/admin/SubjectManagement';
import EnrollmentManagement from './dashboard/admin/EnrollmentManagement';
import TeacherAssignment from './dashboard/admin/TeacherAssignment';
import StudentEnrollment from './dashboard/admin/StudentEnrollment';
import EnrollDeptPage from './dashboard/admin/EnrollDeptPage';
import EnrollSubjectPage from './dashboard/admin/EnrollSubjectPage';
import EnrollStudentsPage from './dashboard/admin/EnrollStudentsPage';
import AdminAnalytics from './dashboard/admin/AdminAnalytics';

import MessagesPage from './dashboard/messages/MessagesPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/attendance/session/:sessionId" element={<MarkAttendance />} />
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/assessments/:assessmentId/marks" element={<UploadMarks />} />

          {/* Student Routes */}
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/marks" element={<StudentMarks />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="teachers" element={<TeachersManagement />} />
            <Route path="students" element={<StudentsManagement />} />
            <Route path="students/batch/:batchId" element={<DeptListPage />} />
            <Route path="students/batch/:batchId/dept/:deptId" element={<StudentListPage />} />
            <Route path="subjects" element={<SubjectManagement />} />
            <Route path="enrollments" element={<EnrollmentManagement />} />
            <Route path="enrollments/teachers" element={<TeacherAssignment />} />
            <Route path="enrollments/students" element={<StudentEnrollment />} />
            <Route path="enrollments/students/batch/:batchId" element={<EnrollDeptPage />} />
            <Route path="enrollments/students/batch/:batchId/dept/:deptId" element={<EnrollSubjectPage />} />
            <Route path="enrollments/students/batch/:batchId/dept/:deptId/subject/:subjectId" element={<EnrollStudentsPage />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          {/* Communication */}
          <Route path="/messages" element={<MessagesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
