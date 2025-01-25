import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../../Context/AppContext";

export default function Show() {
  const { user, token, setUser, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [post, setPost] = useState(null);

  async function getPost() {
    const res = await fetch(`/api/posts/${id}`, {
      method: "get",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok) {
      setPost(data.post);
    }
  }

  async function handleDelete(e) {
    e.preventDefault();
    const res = await fetch(`/api/posts/${id}`, {
      method: "delete",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (res.ok) {
      navigate("/");
    }
    console.log(data);
    if (data.errors) {
      setErrors(data.errors);
    } else {
      navigate("/");
    }
    console.log(data);
  }
  useEffect(() => {
    getPost();
  }, []);

  return (
    <>
      {post ? (
        <div
          key={post.id}
          className="mt-4 p-4 border rounded-md border-dashed border-slate-400"
        >
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h2 className="font-bold text-2xl">{post.title}</h2>
              <small className="text-xs text-slate-600">
                Created by Admin on{" "}
                {new Date(post.created_at).toLocaleTimeString()}
              </small>
            </div>
          </div>
          <p>{post.body}</p>
          <div className="flex items-center justify-end gap-4">
            <Link
              to={`/posts/update/${post.id}`}
              className="bg-green-500 text-white text-sm rounded-lg px-3 py-1"
            >
              Update
            </Link>

            <form onSubmit={handleDelete}>
              <button className="bg-red-500 text-white text-sm rounded-lg px-3 py-1">
                Delete
              </button>
            </form>
          </div>
        </div>
      ) : (
        <p className="title">There is no post</p>
      )}
    </>
  );
}
