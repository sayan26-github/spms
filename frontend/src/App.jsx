import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import RegisterCollege from "./auth/RegisterCollege";
import ProtectedRoute from "./auth/ProtectedRoute";
import Unauthorized from "./components/Unauthorized";
import { AuthProvider } from "./auth/AuthContext";

// Lazy loaded components
const Dashboard = lazy(() => import("./dashboard/Dashboard"));
const AttendancePage = lazy(() => import("./attendance/AttendancePage"));
const MarkAttendance = lazy(() => import("./attendance/MarkAttendance"));
const AssessmentsPage = lazy(() => import("./assessments/AssessmentsPage"));
const UploadMarks = lazy(() => import("./assessments/UploadMarks"));
const StudentAttendance = lazy(() => import("./student/StudentAttendance"));
const StudentDashboard = lazy(() => import('./student/StudentDashboard'));
const PerformanceInsights = lazy(() => import('./student/PerformanceInsights'));
const StudentMarks = lazy(() => import('./student/StudentMarks'));
const StudentTranscript = lazy(() => import('./student/StudentTranscript'));
const StudentProfile = lazy(() => import('./student/StudentProfile'));
const StudentAssignments = lazy(() => import("./assessments/StudentAssignments"));
const AssignmentSubmit = lazy(() => import("./assessments/AssignmentSubmit"));
const StudentPlacements = lazy(() => import('./placements/StudentPlacements'));
const AdminPlacements = lazy(() => import('./placements/AdminPlacements'));

const TeacherAssignments = lazy(() => import("./assessments/TeacherAssignments"));
const AssignmentGrading = lazy(() => import("./assessments/AssignmentGrading"));

const AdminLayout = lazy(() => import('./dashboard/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./dashboard/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./dashboard/admin/UserManagement'));
const TeachersManagement = lazy(() => import('./dashboard/admin/TeachersManagement'));
const StudentsManagement = lazy(() => import('./dashboard/admin/StudentsManagement'));
const DeptListPage = lazy(() => import('./dashboard/admin/DeptListPage'));
const StudentListPage = lazy(() => import('./dashboard/admin/StudentListPage'));
const SubjectManagement = lazy(() => import('./dashboard/admin/SubjectManagement'));
const EnrollmentManagement = lazy(() => import('./dashboard/admin/EnrollmentManagement'));
const TeacherAssignment = lazy(() => import('./dashboard/admin/TeacherAssignment'));
const StudentEnrollment = lazy(() => import('./dashboard/admin/StudentEnrollment'));
const EnrollDeptPage = lazy(() => import('./dashboard/admin/EnrollDeptPage'));
const EnrollSubjectPage = lazy(() => import('./dashboard/admin/EnrollSubjectPage'));
const EnrollStudentsPage = lazy(() => import('./dashboard/admin/EnrollStudentsPage'));
const AdminAnalytics = lazy(() => import('./dashboard/admin/AdminAnalytics'));
const ManageAdmins = lazy(() => import('./dashboard/admin/ManageAdmins'));
const BatchesManagement = lazy(() => import('./dashboard/admin/BatchesManagement'));
const DepartmentsManagement = lazy(() => import('./dashboard/admin/DepartmentsManagement'));
const TranscriptPage = lazy(() => import('./dashboard/admin/TranscriptPage'));

const MessagesPage = lazy(() => import('./dashboard/messages/MessagesPage'));

// Loader for suspense
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-50">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register-college" element={<RegisterCollege />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* General Protected Routes (Any Authenticated User) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/messages" element={<MessagesPage />} />
          </Route>

          {/* Teacher/Admin/Head Routes */}
          <Route element={<ProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'HEAD']} />}>
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/assessments" element={<AssessmentsPage />} />
            <Route path="/assignments" element={<TeacherAssignments />} />
            <Route path="/assignments/:id/grade" element={<AssignmentGrading />} />
            <Route path="/attendance/session/:sessionId" element={<MarkAttendance />} />
            <Route path="/assessments/:assessmentId/marks" element={<UploadMarks />} />
          </Route>

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/marks" element={<StudentMarks />} />
            <Route path="/student/transcript" element={<StudentTranscript />} />
            <Route path="/student/performance" element={<PerformanceInsights />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/assignments" element={<StudentAssignments />} />
            <Route path="/student/assignments/:id/submit" element={<AssignmentSubmit />} />
            <Route path="/student/placements" element={<StudentPlacements />} />
          </Route>

          {/* Admin/Head Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HEAD']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="teachers" element={<TeachersManagement />} />
              <Route path="batches" element={<BatchesManagement />} />
              <Route path="departments" element={<DepartmentsManagement />} />
              <Route path="students" element={<StudentsManagement />} />
              <Route path="students/batch/:batchId" element={<DeptListPage />} />
              <Route path="students/batch/:batchId/dept/:deptId" element={<StudentListPage />} />
              <Route path="students/transcript/:studentId" element={<TranscriptPage />} />
              <Route path="subjects" element={<SubjectManagement />} />
              <Route path="enrollments" element={<EnrollmentManagement />} />
              <Route path="enrollments/teachers" element={<TeacherAssignment />} />
              <Route path="enrollments/students" element={<StudentEnrollment />} />
              <Route path="enrollments/students/batch/:batchId" element={<EnrollDeptPage />} />
              <Route path="enrollments/students/batch/:batchId/dept/:deptId" element={<EnrollSubjectPage />} />
              <Route path="enrollments/students/batch/:batchId/dept/:deptId/subject/:subjectId" element={<EnrollStudentsPage />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="manage-admins" element={<ManageAdmins />} />
              <Route path="placements" element={<AdminPlacements />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
