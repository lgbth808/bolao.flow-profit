import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bet Barão by d. Rosa",
    short_name: "Bet Barão",
    description: "O bolão da Família Silva.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF6E5",
    theme_color: "#0F3D2E",
    icons: [
      {
        src: "/brand/icone_app_128.png",
        sizes: "128x128",
        type: "image/png"
      },
      {
        src: "/brand/icone_app_256.png",
        sizes: "256x256",
        type: "image/png"
      },
      {
        src: "/brand/icone_app_512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/brand/icone_app_1024.png",
        sizes: "1024x1024",
        type: "image/png"
      }
    ]
  };
}
