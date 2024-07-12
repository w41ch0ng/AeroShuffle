import { useEffect, useState } from "react";
import { Playlist } from "../interfaces";
import InformationIcon from "./InformationIcon";

interface EditPlaylistModalProps {
  playlist: Playlist;
  onClose: () => void;
  onSave: (updatedPlaylist: Partial<Playlist>, imageFile: File | null) => void;
}

export default function EditPlaylistModal({
  playlist,
  onClose,
  onSave,
}: EditPlaylistModalProps) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description);
  const [isPublic, setIsPublic] = useState(playlist.public);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  //useEffect to get the preview image of the playlist
  useEffect(() => {
    setPreviewImage(playlist.images[0]?.url || null);
  }, [playlist.images]);

  // Function to handle changing the image of the playlist
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Function to handle submitting the playlist update
  const handleSubmit = () => {
    onSave(
      {
        name,
        description: description || " ",
        public: isPublic,
      },
      imageFile
    );
  };

  // Function to toggle the public status of the playlist
  const togglePublicStatus = () => {
    setIsPublic(!isPublic);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 p-6 rounded-md">
        <h2 className="text-2xl text-white mb-4">Edit Playlist</h2>
        <div className="mb-4">
          <label className="block text-white pb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded-md text-white"
            maxLength={35}
          />
        </div>
        <div className="mb-4">
          <label className="block text-white pb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full p-2 border rounded-md resize-none text-white"
            maxLength={100}
          />
        </div>
        <div className="mb-4">
          <label className="text-white flex flex-row pb-2">
            Public
            <InformationIcon
              content="Toggle playlist visibility. This only affects the
             visibility of the playlist on your profile and in search results. To change
              the public/private status of the playlist, log into the Spotify client."
            >
              <i className="fa-solid fa-circle-info px-1 text-blue-500 cursor-pointer" />
            </InformationIcon>
          </label>
          <button
            onClick={togglePublicStatus}
            className={`px-4 py-2 rounded-md ${
              isPublic ? "bg-green-500 text-white" : "bg-gray-500 text-white"
            }`}
          >
            {isPublic ? "Public" : "Private"}
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-white pb-2">Image</label>
          {previewImage && (
            <div className="mb-4">
              <img
                src={previewImage}
                alt="Preview"
                className="w-32 h-32 object-cover"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-2 border rounded-md text-white"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-green-500 text-white px-4 py-2 rounded-md mr-2"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-md"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
