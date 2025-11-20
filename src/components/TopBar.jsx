import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../client";

export default function TopBar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    }
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <AppBar position="sticky" sx={{ mb: 3} }>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ color: "white", textDecoration: "none", mr: 3 }}
          >
            HikeConnect
          </Typography>

          {user && (
            <>
              <Button color="inherit" component={Link} to="/">
                View Posts
              </Button>
              <Button color="inherit" component={Link} to="/create">
                Create Post
              </Button>
            </>
          )}
        </Box>

        <Box>
          {!user && (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
            </>
          )}

          {user && (
            <>
            <Button color="inherit" component={Link} to="/profile">
                Profile
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Log Out
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
