import { useEffect, useState } from "react";
import { supabase } from "../client";
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  CircularProgress,
} from "@mui/material";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(""); 
  const [loading, setLoading] = useState(true);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setEmail(user.email); // 

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setUsername(data.username || "");

      // If avatar exists, load public URL
      if (data.avatar_url) {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(data.avatar_url);

        setAvatarPreview(urlData.publicUrl);
      }
    }

    setLoading(false);
  };

  // Upload avatar to storage
  const uploadAvatar = async (file) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${profile.id}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.log("Upload error:", error);
      return null;
    }

    return filePath;
  };

  // Save updates
  const saveProfile = async () => {
    setLoading(true);

    let avatar_url = profile.avatar_url;

    // Only upload if user selected a new file
    if (avatarFile) {
      const uploadedPath = await uploadAvatar(avatarFile);
      if (uploadedPath) {
        avatar_url = uploadedPath;
      }
    }

    await supabase
      .from("profiles")
      .update({
        username,
        avatar_url,
        updated_at: new Date(),
      })
      .eq("id", profile.id);

    await loadProfile();
    setLoading(false);
  };

  // Handle avatar selection — show preview instantly
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);

    // Instant preview before uploading
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
  };

  if (loading || !profile)
    return (
      <Box p={3}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Profile
      </Typography>

      {/* Avatar Section */}
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Avatar
          src={avatarPreview} // 
          sx={{ width: 120, height: 120, mx: "auto", mb: 2 }}
        />

        <Button variant="outlined" component="label">
          Upload New Avatar
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </Button>
      </Box>

      {/* Username */}
      <TextField
        fullWidth
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Get email (read-only) */}
      <TextField
        fullWidth
        label="Email"
        value={email}
        InputProps={{ readOnly: true }}
        sx={{ mb: 3 }}
      />

      <Button variant="contained" fullWidth onClick={saveProfile}>
        Save Changes
      </Button>
    </Box>
  );
}
