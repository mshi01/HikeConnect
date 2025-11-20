import { useState, useEffect } from "react";
import { supabase } from "../client";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  TextField,
  Button,
  IconButton,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import { Link } from "react-router-dom";

export default function HomeFeed() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    load();
  }, [sort]);

  const load = async () => {
    let query = supabase
      .from("posts")
      .select(`
        *,
        post_images(image_url),
        post_tags!post_tags_post_id_fkey(
          tags(name)
        )
      `);

    if (sort === "newest") query = query.order("created_at", { ascending: false });
    if (sort === "popular") query = query.order("upvotes", { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error("Supabase query error:", error);
      alert(`Error loading posts: ${error.message}`);
    }
    setPosts(data || []);
  };

  const upvote = async (id) => {
    const { error } = await supabase.rpc("increment_upvotes", { post_id: id });
    if (!error) load();
  };

  const filtered = posts.filter((p) => {
    const s = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(s) ||
      p.trail_name?.toLowerCase().includes(s) ||
      p.post_tags?.some((pt) => pt.tags?.name.toLowerCase().includes(s))
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Trail Posts
      </Typography>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search by title, trail name, or tags..."
        sx={{ mb: 2 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Sorting */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button
          variant={sort === "newest" ? "contained" : "outlined"}
          onClick={() => setSort("newest")}
        >
          Newest
        </Button>
        <Button
          variant={sort === "popular" ? "contained" : "outlined"}
          onClick={() => setSort("popular")}
        >
          Most Popular
        </Button>
      </Box>

      {/* Posts */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 3,
        }}
      >
        {filtered.map((post) => (
          <Card key={post.id} sx={{ maxWidth: 350, position: "relative" }}>
            {/* Clickable area */}
            <Box component={Link} to={`/post/${post.id}`} style={{ textDecoration: "none" }}>
              {post.post_images?.[0]?.image_url && (
                <CardMedia
                  component="img"
                  image={post.post_images[0].image_url}
                  alt={post.title}
                  sx={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover", 
                  }}
                />
              )}

              <CardContent>
                <Typography variant="h6">{post.title}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  {post.trail_name}
                </Typography>
                <Typography variant="caption">
                  {new Date(post.created_at).toLocaleString()}
                </Typography>

                {/* Tags */}
                <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {post.post_tags?.map((pt) => (
                    <Chip key={pt.tags.name} label={pt.tags.name} size="small" />
                  ))}
                </Box>

                <Typography variant="body2" sx={{ mt: 1 }}>
                  👍 {post.upvotes || 0} Upvotes
                </Typography>
              </CardContent>
            </Box>

            {/* Upvote button */}
            <IconButton
              onClick={() => upvote(post.id)}
              sx={{ position: "absolute", top: 10, right: 10, bgcolor: "white" }}
            >
              <ThumbUpIcon />
            </IconButton>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
