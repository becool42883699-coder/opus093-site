"use client";

/**
 * サブパス配信(GitHub Pages等)用の画像ローダー。
 * 最適化は行わず、src に NEXT_PUBLIC_BASE_PATH を付与するだけ。
 * (next/image はデフォルトでは basePath を画像srcに適用しないため)
 */
export default function pagesImageLoader({ src }: { src: string }) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${src}`;
}
