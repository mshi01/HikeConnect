import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import bgImage from "../assets/background.jpg";

export default function FrontPage() {
  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        textAlign: "center",
        px: 2,
      }}
    >
      <Typography variant="h2" sx={{ fontWeight: "bold", mb: 2 }}>
        HikeConnect
      </Typography>

      <Typography variant="h5" sx={{ maxWidth: 600, mb: 4 }}>
        Discover trails, share experiences, and connect with fellow hikers.
      </Typography>

      <Button
        component={Link}
        to="/login"
        variant="contained"
        size="large"
        sx={{ bgcolor: "rgba(0,0,0,0.6)" }}
      >
        Get Started
      </Button>
    </Box>
  );
}
