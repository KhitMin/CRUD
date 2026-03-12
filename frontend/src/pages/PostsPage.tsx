import { useEffect, useState } from "react";
import { postService } from "../services/posts";
import { useAuth } from "../context/AuthContext";
import Pagination from "../components/Pagination";
import type { Post, PaginationMeta } from "../types";

export default function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Create post form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Edit post
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const fetchPosts = async (p: number) => {
    setLoading(true);
    try {
      const res = await postService.getAll(p);
      setPosts(res.data);
      setMeta(res.meta ?? null);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await postService.create({ title, content });
      setTitle("");
      setContent("");
      setShowForm(false);
      fetchPosts(1);
      setPage(1);
    } catch {
      // error
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await postService.delete(id);
      fetchPosts(page);
    } catch {
      // error
    }
  };

  const startEdit = (post: Post) => {
    setEditId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    try {
      await postService.update(editId, {
        title: editTitle,
        content: editContent,
      });
      setEditId(null);
      fetchPosts(page);
    } catch {
      // error
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "New Post"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-4 space-y-3 rounded bg-white p-4 shadow"
        >
          <input
            type="text"
            placeholder="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
          <textarea
            placeholder="Content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded border px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={formLoading}
            className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            {formLoading ? "Creating..." : "Create"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="mt-8 text-center text-gray-500">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">No posts yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="rounded bg-white p-4 shadow">
              {editId === post.id ? (
                <form onSubmit={handleUpdate} className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded border px-3 py-2"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full rounded border px-3 py-2"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="rounded border px-3 py-1 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">{post.title}</h2>
                  <p className="mt-1 text-gray-600">{post.content}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      By {post.user?.name ?? "Unknown"} &middot;{" "}
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    {(post.userId === user?.id ||
                      post.user?.id === user?.id) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(post)}
                          className="text-indigo-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {meta && <Pagination meta={meta} onPageChange={setPage} />}
    </div>
  );
}
