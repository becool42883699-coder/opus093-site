import type { NextConfig } from "next";

/**
 * 通常の dev / build / start は従来どおり(追加設定なし)。
 * NEXT_OUTPUT=export のときだけ静的書き出し(out/)モードになる。
 * NEXT_PUBLIC_BASE_PATH はサブパス配信(GitHub Pages等)用で、
 * 指定時は画像srcにも同パスを付与する(app/pages-image-loader.ts)。
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig =
  process.env.NEXT_OUTPUT === "export"
    ? {
        output: "export",
        trailingSlash: true,
        ...(basePath ? { basePath, assetPrefix: basePath } : {}),
        images: basePath
          ? { loader: "custom", loaderFile: "./app/pages-image-loader.ts" }
          : { unoptimized: true },
      }
    : {};

export default nextConfig;
