import { useEffect, useState } from "react";
import { supabase } from "./client";

import TopBar from "./components/TopBar";
import HomeFeed from "./pages/HomeFeed";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import EditPost from "./pages/EditPost";
import Login from "./pages/Login";
import FrontPage from "./pages/LandingPage";
import ProfilePage from "./pages/Profile";

import { Routes, Route, Navigate } from "react-router-dom";
import { Container } from "@mui/material";

const ProtectedRoute = ({ element: Component, user }) => {
  return user ? <Component /> : <Navigate to="/login" replace />;
};


export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
    }
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <TopBar />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Routes>
          {/* Public landing page */}
          <Route
            path="/"
            element={user ? <HomeFeed /> : <FrontPage />}
          />

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route path="/create" element={user ? <CreatePost /> : <Login />} />
          <Route path="/profile" element={user ? <ProfilePage /> :<Login />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/edit/:id" element={user ? <EditPost /> : <Login />} />
        </Routes>
      </Container>
    </>
  );
}