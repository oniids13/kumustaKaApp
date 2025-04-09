import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'

// Pages
import MainContent from '../component/MainContent'
import Index from '../pages/Index'
import Login from '../pages/Login'
import RegisterPage from '../pages/Register'
import ErrorPage from '../pages/ErrorPage'  
import HomePage from '../pages/HomePage'

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
            <Route path='home' element={<HomePage />} />
        </Route>
    )
)

export default router