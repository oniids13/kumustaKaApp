import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'

// Pages
import MainContent from '../component/MainContent'
import Index from '../pages/Index'
import Login from '../pages/Login'
import Signup from '../pages/Signup'



const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path='/'
            element={<MainContent />}
            errorElement={<h1>Page not found</h1>}
        >
            <Route index element={<Index />} />
            <Route path='login' element={<Login />} />
            <Route path='signup' element={<Signup />} />
        </Route>
    )
)

export default router