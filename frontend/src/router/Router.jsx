import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'

// Pages
import MainContent from '../component/MainContent'
import Index from '../pages/Index'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import ErrorPage from '../pages/ErrorPage'


const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path='/'
            element={<MainContent />}
            errorElement={<ErrorPage />}
        >
            <Route index element={<Index />} />
            <Route path='login' element={<Login />} />
            <Route path='signup' element={<Signup />} />
        </Route>
    )
)

export default router