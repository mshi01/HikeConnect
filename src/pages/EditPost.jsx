import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../client";
import { Box, Typography, TextField, Button } from "@mui/material";

export default function EditPost() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [trailName, setTrailName] = useState("");        
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("posts")
      .select(`
        *,
        post_images ( image_url ),
        post_tags (
          tags ( name )
        )
      `)
      .eq("id", id)
      .single();

    setTitle(data.title);
    setDesc(data.description);
    setTrailName(data.trail_name || "");                 

    setTags(data.post_tags.map(pt => pt.tags.name).join(", "));
    setExistingImages(data.post_images);
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("trail-images")
      .upload(fileName, imageFile, { upsert: true });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    return supabase.storage.from("trail-images").getPublicUrl(fileName).data.publicUrl;
  };

  const update = async () => {
    // Update posts table
    await supabase
      .from("posts")
      .update({
        title,
        description: desc,
        trail_name: trailName,                         
        updated_at: new Date(),
      })
      .eq("id", id);

    // Handle image upload
    let newImageUrl = await uploadImage();

    if (newImageUrl) {
      await supabase.from("post_images").delete().eq("post_id", id);

      await supabase.from("post_images").insert({
        post_id: id,
        image_url: newImageUrl,
      });
    }

    // Update tags
    const tagList = tags
      .split(",")
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    await supabase.from("post_tags").delete().eq("post_id", id);

    for (const name of tagList) {
      let { data: existingTag } = await supabase
        .from("tags")
        .select("id")
        .eq("name", name)
        .single();

      if (!existingTag) {
        const { data: newTag } = await supabase
          .from("tags")
          .insert({ name })
          .select()
          .single();
        existingTag = newTag;
      }

      await supabase.from("post_tags").insert({
        post_id: id,
        tag_id: existingTag.id,
      });
    }

    nav(`/post/${id}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Edit Post</Typography>

      {/* Title */}
      <TextField
        fullWidth
        label="Title"
        sx={{ mb: 2 }}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Trail Name */}
      <TextField
        fullWidth
        label="Trail Name"
        sx={{ mb: 2 }}
        value={trailName}
        onChange={(e) => setTrailName(e.target.value)}
      />

      {/* Description */}
      <TextField
        fullWidth
        label="Description"
        multiline
        rows={4}
        sx={{ mb: 2 }}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />

      {/* Tags */}
      <TextField
        fullWidth
        label="Tags (comma-separated)"
        sx={{ mb: 2 }}
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      {/* Existing Images Preview */}
      {existingImages.length > 0 && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle1">Current Image:</Typography>
          <img
            src={existingImages[0].image_url}
            style={{
              width: "200px",
              borderRadius: "8px",
              marginTop: "10px",
            }}
          />
        </Box>
      )}

      {/* Upload New Image */}
      <Button variant="outlined" component="label" sx={{ mb: 2 }}>
        Upload New Trail Image
        <input
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
      </Button>

      <Button variant="contained" sx={{ mt: 2, display: "block" }} onClick={update}>
        Save Changes
      </Button>
    </Box>
  );
}
