import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bet Barão by d. Rosa",
    short_name: "Bet Barão",
    description: "O bolão da família Silva, agregados e amigos.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF0D6",
    theme_color: "#0F3D2E",
    icons: [
      {
        src: "/brand/icones/favicon.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/brand/logos/logo_simbolo.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
