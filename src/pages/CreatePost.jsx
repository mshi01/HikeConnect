import { useState } from "react";
import { supabase } from "../client";
import { Box, TextField, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [trailName, setTrailName] = useState("");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState([]);
  const nav = useNavigate();

  const submit = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user.id;

    // Convert comma-separated tags into an array
    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean); 

    try {
      // Insert into posts (tags as array)
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          title,
          description: desc,
          trail_name: trailName
        })
        .select()
        .single();

      if (postError) {
        console.error("Post insert failed:", postError);
        return;
      }

      console.log("Post created:", post);

      // Upload images to storage and insert into post_images
      for (let img of images) {
        const path = `posts/${post.id}/${img.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("trail-photos")
          .upload(path, img, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          console.error("Upload failed:", uploadError);
          continue; 
        }

        const url = supabase.storage.from("trail-photos").getPublicUrl(path).data.publicUrl;

        const { error: imgInsertError } = await supabase
          .from("post_images")
          .insert({ post_id: post.id, image_url: url, user_id: userId });

        if (imgInsertError) {
          console.error("Post image insert failed:", imgInsertError);
        }
      }

      // Handle tags in post_tags join table
      for (let t of tagsArray) {
        // Check if tag exists
        const { data: tagData } = await supabase.from("tags").select().eq("name", t).maybeSingle();
        let tagId = tagData?.id;

        if (!tagData) {
          // Insert new tag
          const { data: newTag } = await supabase.from("tags").insert({ name: t }).select().maybeSingle();
          tagId = newTag.id;
        }

        // Insert into post_tags
        const { error: postTagError } = await supabase.from("post_tags").insert({
          post_id: post.id,
          tag_id: tagId,
        });

        if (postTagError) {
          console.error("Post tag insert failed:", postTagError);
        }
      }

      // Navigate to the new post page
      nav(`/post/${post.id}`);
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Create Post</Typography>

      <TextField
        fullWidth
        sx={{ mb: 2 }}
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <TextField
        fullWidth
        sx={{ mb: 2 }}
        label="Trail Name"
        value={trailName}
        onChange={(e) => setTrailName(e.target.value)}
      />
      <TextField
        fullWidth
        sx={{ mb: 2 }}
        label="Description"
        multiline
        rows={4}
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <TextField
        fullWidth
        sx={{ mb: 2 }}
        label="Tags (comma-separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <input type="file" multiple onChange={(e) => setImages(Array.from(e.target.files))} />

      <Button variant="contained" sx={{ mt: 3 }} onClick={submit}>
        Submit
      </Button>
    </Box>
  );
}
