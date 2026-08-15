import type { Env } from "../src/index";

declare module "cloudflare:test" {
  // SELF等に型を付けるため、Workerの環境型をテストランナーへ知らせる
  interface ProvidedEnv extends Env {}
}
