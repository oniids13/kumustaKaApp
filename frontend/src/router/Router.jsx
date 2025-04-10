import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'

import ProtectedRoute from '../component/ProtectedRoute'
// Pages
import MainContent from '../component/MainContent'
import Index from '../pages/Index'
import Login from '../pages/Login'
import RegisterPage from '../pages/Register'
import ErrorPage from '../pages/ErrorPage'  
import UnauthorizedPage from '../pages/UnauthorizedPage'

// Dashboard Pages
import StudentDashboard from '../pages/StudentDashboard'
import CounselorDashboard from '../pages/CounselorDashboard'
import TeacherDashboard from '../pages/TeacherDashboard'
import AdminDashboard from '../pages/AdminDashboard'

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path='/'
            element={<MainContent />}
            errorElement={<ErrorPage />}
        >
            <Route index element={<Index />} />
            <Route path='login' element={<Login />} />
            <Route path='register' element={<RegisterPage />} />

            <Route path="unauthorized" element={<UnauthorizedPage />} />

             {/* Role-specific dashboards */}
             <Route path='student' element={
                <ProtectedRoute roles={['STUDENT']}>
                    <StudentDashboard />
                </ProtectedRoute>
            } />
            
            <Route path='counselor' element={
                <ProtectedRoute roles={['COUNSELOR']}>
                    <CounselorDashboard />
                </ProtectedRoute>
            } />
            
            <Route path='teacher' element={
                <ProtectedRoute roles={['TEACHER']}>
                    <TeacherDashboard />
                </ProtectedRoute>
            } />
            
            <Route path='admin' element={
                <ProtectedRoute roles={['ADMIN']}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
        </Route>
    )
)

export default router