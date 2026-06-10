import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dishcover",
    short_name: "Dishcover",
    description:
      "Pick a mood and a budget — get 3–5 nearby restaurants with the dishes people actually rave about.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff9f4",
    theme_color: "#c2410c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
