import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// @cloudflare/vitest-pool-workers 0.21+ (Vitest 4系) の推奨構成。
// wrangler.jsonc から main・バインディングを読み込み、テスト専用の値を miniflare で上書きする。
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        // 本番では `wrangler secret put ADMIN_TOKEN` で設定するシークレットを、
        // テストでは固定値として注入する(test/hub.test.ts の TOKEN と一致させる)
        bindings: { ADMIN_TOKEN: "test-admin-token" },
      },
    }),
  ],
});
