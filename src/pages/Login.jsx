import { useState } from "react";
import { supabase } from "../client";
import { TextField, Button, Box, Container, Typography, Paper, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  async function handleSignIn(e) {
    e.preventDefault();
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    navigate("/");
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setErrorMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }
  }

  return (
    <Box display="flex" justifyContent="center" sx={{ mt: 6 }}>
      <Paper sx={{ p: 4, width: 400 }}>
        <Typography variant="h5" mb={2}>Login or Sign Up</Typography>

        <Container maxWidth="sm" sx={{ mt: 4 }}>
          <form>
            <TextField
              fullWidth
              label="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="password"
              label="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />

            {errorMessage && (
              <Typography color="error" mb={2}>
                {errorMessage}
              </Typography>
            )}

            <Stack spacing={2}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSignIn}
              >
                Sign In
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={handleSignUp}
              >
                Sign Up
              </Button>
            </Stack>
          </form>
        </Container>
      </Paper>
    </Box>
  );
}
