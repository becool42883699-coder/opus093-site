/**
 * Tailwind v4 の PostCSS プラグイン。
 * 有効になるのは `@import "tailwindcss"` を書いた CSS だけで、
 * 既存の globals.css / *.module.css はディレクティブが無いため素通りする。
 * 現状 Tailwind を使うのは /tomoshibi(灯家 LP)の1ルートのみ。
 */
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};

export default config;
