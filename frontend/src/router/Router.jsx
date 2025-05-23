import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import ProtectedRoute from "../component/ProtectedRoute";
// Pages
import MainContent from "../component/MainContent";
import Index from "../pages/Index";
import Login from "../pages/Login";
import RegisterPage from "../pages/Register";
import ErrorPage from "../pages/ErrorPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import DailySurveyPage from "../pages/DailySurveyPage";

// Dashboard Pages
import StudentDashboard from "../modules/student/StudentDashboard";
import CounselorDashboard from "../modules/counselor/CounselorDashboard";
import TeacherDashboard from "../modules/teacher/TeacherDashboard";
import AdminDashboard from "../modules/admin/AdminDashboard";

// Student Module Pages
import InitialAssessmentPage from "../modules/student/component/InitialAssessment";

// Counselor Module Pages
import CreateIntervention from "../modules/counselor/component/CreateIntervention";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<MainContent />} errorElement={<ErrorPage />}>
      <Route index element={<Index />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<RegisterPage />} />

      <Route path="unauthorized" element={<UnauthorizedPage />} />

      {/* Role-specific dashboards */}
      <Route
        path="student"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="student/initial-assessment"
        element={
          <ProtectedRoute roles={["STUDENT"]}>
            <InitialAssessmentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/daily-survey"
        element={
          <ProtectedRoute>
            <DailySurveyPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="counselor"
        element={
          <ProtectedRoute roles={["COUNSELOR"]}>
            <CounselorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Add route for counselor/analytics */}
      <Route
        path="counselor/analytics"
        element={
          <ProtectedRoute roles={["COUNSELOR"]}>
            <CounselorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Add route for creating interventions */}
      <Route
        path="counselor/interventions/create"
        element={
          <ProtectedRoute roles={["COUNSELOR"]}>
            <CreateIntervention />
          </ProtectedRoute>
        }
      />

      <Route
        path="teacher"
        element={
          <ProtectedRoute roles={["TEACHER"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Route>
  )
);

export default router;
