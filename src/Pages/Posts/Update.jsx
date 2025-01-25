import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../Context/AppContext";
import { useNavigate, useParams } from "react-router-dom";

export default function Update() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AppContext);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
  });

  const [errors, setErrors] = useState({});

  async function getPost() {
    const res = await fetch(`/api/posts/${id}`, {
      method: "get",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok) {
      setFormData({
        title: data.post.title,
        body: data.post.body,
      });
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    const res = await fetch(`/api/posts/${id}`, {
      method: "put",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

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
      <h1 className="title">Update the post</h1>

      <form onSubmit={handleUpdate} className="w-1/2 mx-auto space-y-6">
        <div>
          <input
            type="text"
            placeholder="Post Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
          {errors.title && <p className="error">{errors.title[0]}</p>}
        </div>
        <div>
          <textarea
            rows="6"
            type="text"
            placeholder="Post Content"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          />
          {errors.body && <p className="error">{errors.body[0]}</p>}
        </div>
        <button className="primary-btn">Update</button>
      </form>
    </>
  );
}
