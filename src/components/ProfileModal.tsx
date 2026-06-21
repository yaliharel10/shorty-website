"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { Modal } from "./Modal";
import { FormField, inputClassName } from "./FormField";

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ProfileModal({ open, onClose, onSuccess }: ProfileModalProps) {
  const { user, refresh } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const username = (form.get("username") as string).trim();
    const photoUrl = (form.get("photoUrl") as string).trim();

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, photoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      await refresh();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit profile"
      description="Update how you appear across Shorty."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField id="profile-username" label="Username">
          <input
            id="profile-username"
            name="username"
            defaultValue={user.username}
            required
            autoComplete="username"
            className={inputClassName}
          />
        </FormField>
        <FormField
          id="profile-photo"
          label="Avatar URL"
          hint="Optional — link to a square profile image"
        >
          <input
            id="profile-photo"
            name="photoUrl"
            type="url"
            defaultValue={user.photoUrl || ""}
            placeholder="https://..."
            className={inputClassName}
          />
        </FormField>
        {error && (
          <p role="alert" className="text-center text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#ff7a18] py-3 text-sm font-bold transition hover:bg-[#ff9533] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a18] disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </Modal>
  );
}
