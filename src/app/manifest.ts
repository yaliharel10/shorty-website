import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shorty — Premium Short Films",
    short_name: "Shorty",
    description: "Stream curated short films. Drama, comedy, animation, sci-fi and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#ff7a18",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
