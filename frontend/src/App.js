import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Navbar from './common/Navbar';
import SearchResults from './pages/search/SearchResults';
import Home from './pages/landingPage/Home';
import Login from './pages/auth/Login';
import Registration from './pages/auth/Registration';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ProfileHome from './pages/profile/ProfileHome';
import ProfileSettings from './pages/profile/ProfileSettings';
import Communities from './pages/communities/Communities';
import CreateCommunity from './pages/communities/CreateCommunity';
import CommunityDetail from './pages/communities/CommunityDetail';
import CommunityAdmin from './pages/communities/CommunityAdmin';
import DiscussionDetail from './pages/discussions/DiscussionDetail';
import CreateDiscussion from './pages/discussions/CreateDiscussion';
import ShareResource from './pages/resources/ShareResource';
import Notifications from './pages/notifications/Notifications';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';

// Import App.css for layout structure
import './App.css'; 

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          
          <Navbar />
          
          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme='colored'
          />

          <div className="main-content container-fluid p-0"> 
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path='/login' element={<Login />} />
              <Route path='/register' element={<Registration />} />
              <Route path='/forgot-password' element={<ForgotPassword />} />
              <Route path='/reset-password/:token' element={<ResetPassword />} />
              <Route path='/home' element={<ProfileHome />} />
              <Route path='/profile-settings' element={<ProfileSettings />} />
              <Route path='/communities' element={<Communities />} />
              <Route path='/create-community' element={<CreateCommunity />} />
              <Route path='/communities/:id' element={<CommunityDetail />} />
              <Route path='/communities/:id/admin' element={<CommunityAdmin/>} />
              <Route path='/communities/:id/create-discussion' element={<CreateDiscussion />} />
              <Route path='/communities/:id/share-resource' element={<ShareResource />} />
              <Route path='/discussion/:id' element={<DiscussionDetail />} />
              <Route path='/notifications' element={<Notifications />} />
              <Route path='/admin' element={<SuperAdminDashboard/>} />
            </Routes>
          </div>
          
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;