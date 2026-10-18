"""背骨ロゴ(紺→明るい青)を、濃い背景用の「白→シアン」に置き換える。

形(パス)は一切変えず、グラデーションの色だけを写す。
紺(青の成分が小さい色)ほど白、明るい青(青の成分が 240 以上)ほどシアンになるよう補間する。

    python3 tools/logo_reverse.py brand/T-Rex_spine.svg site/assets/logo-spine-reverse.svg
"""

import re
import sys

WHITE = (255, 255, 255)
CYAN = (0, 207, 255)  # ページのアクセント(--cyan)と同じ


def remap(hex6: str) -> str:
    r, g, b = (int(hex6[i:i + 2], 16) for i in (0, 2, 4))
    t = max(0.0, min(1.0, (b - 80) / (240 - 80)))
    t = t * t * (3 - 2 * t)
    return "#%02X%02X%02X" % tuple(round(WHITE[i] + (CYAN[i] - WHITE[i]) * t) for i in range(3))


def main(src: str, dst: str) -> None:
    svg = open(src, encoding="iso-8859-1").read()
    svg, n = re.subn(r"stop-color:#([0-9A-Fa-f]{6})", lambda m: "stop-color:" + remap(m.group(1)), svg)
    svg, k = re.subn(r'fill="#([0-9A-Fa-f]{6})"', lambda m: 'fill="' + remap(m.group(1)) + '"', svg)
    open(dst, "w", encoding="iso-8859-1").write(svg)
    print(f"stop-color {n} / fill {k} を置き換えた -> {dst}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
