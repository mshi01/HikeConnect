import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../client";
import { Box, Typography, Button, TextField, Chip, Paper, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [user, setUser] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    loadUser();
    loadPostAndComments();
  }, [id]);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  };

  const loadPostAndComments = async () => {
    // Fetch post + images + tags
    const { data: post } = await supabase
      .from("posts")
      .select(`
        *,
        post_images ( image_url ),
        post_tags ( tags ( name ) )
      `)
      .eq("id", id)
      .single();

    // *** Cannot join profiles and comments directly since there are no direct foreign key from comments to profiles ***
    // *** Solution: Fetch comments and profiles seperately and then merge them ***
    
    // Fetch comments with user_id
    const { data: commentsData } = await supabase
      .from("comments")
      .select("id, user_id, content, created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: false });

    let commentsWithUsernames = commentsData || [];

    if (commentsWithUsernames.length > 0) {
      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(commentsWithUsernames.map(c => c.user_id))];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      // Merge username into comments
      commentsWithUsernames = commentsWithUsernames.map(c => {
        const profile = profiles.find(p => p.id === c.user_id);
        return { ...c, username: profile?.username || "Unknown User" };
      });
    }

    setPost(post);
    setComments(commentsWithUsernames);
    setCommentText("");
    setEditingCommentId(null);
  };

  const upvote = async () => {
    await supabase.rpc("increment_upvotes", { post_id: id });
    loadPostAndComments();
  };

  const addComment = async () => {
    if (!user) return alert("You must be logged in to comment.");
    if (commentText.trim() === "") return;

    if (editingCommentId) {
      // Update existing comment
      await supabase
        .from("comments")
        .update({ content: commentText })
        .eq("id", editingCommentId);
    } else {
      // Add new comment
      await supabase.from("comments").insert({
        post_id: id,
        content: commentText,
        user_id: user.id,
      });
    }

    loadPostAndComments();
  };

  const editComment = (comment) => {
    setEditingCommentId(comment.id);
    setCommentText(comment.content);
  };

  const deleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    await supabase.from("comments").delete().eq("id", commentId);
    loadPostAndComments();
  };

  const remove = async () => {
    await supabase.from("posts").delete().eq("id", id);
    nav("/");
  };

  if (!post) return <Typography sx={{ p: 3 }}>Loading...</Typography>;

  return (
    <Box sx={{ p: 3, maxWidth: "900px", mx: "auto" }}>
      {/* Post Card */}
      <Paper
  sx={{
    p: 4,
    borderRadius: 4,
    boxShadow: 4,
    bgcolor: "background.paper",
  }}
>
  {/* Title */}
  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
    {post.title}
  </Typography>

  {/* Trail Name */}
  <Typography
    variant="subtitle1"
    sx={{ color: "text.secondary", mb: 2, fontStyle: "italic" }}
  >
    📍 {post.trail_name}
  </Typography>

  {/* Date */}
  <Typography
    variant="caption"
    sx={{ color: "text.secondary", display: "block", mb: 3 }}
  >
    Posted on {new Date(post.created_at).toLocaleString()}
  </Typography>

  {/* IMAGES */}
  {post.post_images.length > 0 && (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        overflowX: "auto",
        py: 1,
        mb: 3,
      }}
    >
      {post.post_images.map((img, idx) => (
        <Box
          key={idx}
          component="img"
          src={img.image_url}
          alt="Trail"
          sx={{
            width: { xs: "90%", sm: 350, md: 450 },
            height: 300,
            borderRadius: 3,
            objectFit: "cover",
            flexShrink: 0,
            boxShadow: 2,
          }}
        />
      ))}
    </Box>
  )}

  {/* Description */}
  <Typography
    variant="body1"
    sx={{ lineHeight: 1.7, mb: 3 }}
  >
    {post.description}
  </Typography>

  {/* Tags */}
  {post.post_tags?.length > 0 && (
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {post.post_tags.map((pt, i) => (
          <Chip
            key={i}
            label={pt.tags.name}
            variant="outlined"
            color="default"
            size="small"
            sx={{ bgcolor: "#e0e0e0", borderRadius: 2 }}
          />
        ))}
      </Box>
  )}

  {/* Actions */}
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 2,
      flexWrap: "wrap",
      mt: 4,
    }}
  >
    <Typography variant="body1" sx={{ fontWeight: 600 }}>
      👍 {post.upvotes || 0} Upvotes
    </Typography>

    <Button variant="contained" onClick={upvote}>
      Upvote
    </Button>

    <Button
      variant="outlined"
      component={Link}
      to={`/edit/${post.id}`}
      color="primary"
    >
      Edit
    </Button>

    <Button
      variant="outlined"
      color="primary"
      onClick={remove}
    >
      Delete
    </Button>
  </Box>
</Paper>

      {/* Comments Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>Comments</Typography>

        {comments.map(c => (
          <Paper key={c.id} sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: "#f9f9f9" }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {new Date(c.created_at).toLocaleString()}
            </Typography>

            <Typography sx={{ fontWeight: "bold", mt: 1 }}>{c.username}</Typography>
            <Typography sx={{ mt: 1 }}>{c.content}</Typography>

            {user?.id === c.user_id && (
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <IconButton size="small" onClick={() => editComment(c)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => deleteComment(c.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Paper>
        ))}

        <TextField
          fullWidth
          multiline
          rows={3}
          sx={{ mt: 2 }}
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <Button variant="contained" sx={{ mt: 2 }} onClick={addComment}>
          {editingCommentId ? "Update Comment" : "Add Comment"}
        </Button>
      </Box>
    </Box>
  );
}
