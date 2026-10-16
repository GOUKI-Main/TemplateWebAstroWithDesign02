// src/content/design.ts
// Look-and-feel settings that are not colors. Colors and font-family names
// live in src/styles/global.css (@theme); this file holds what CSS cannot:
// the web-font stylesheet URL and the numbers the GSAP layer reads.

export const design = {
  fonts: {
    /** Google Fonts stylesheet, loaded by Base.astro. The family names must
     *  match --font-sans / --font-serif / --font-en in global.css. Set to ""
     *  to fall back to the system fonts listed there. */
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap",
  },

  /**
   * アニメーション設定
   * src/scripts/animations.ts が実際に読み込む唯一の定義元。
   * 値を変えるとサイト全体のスクロール演出に反映される。
   */
  animation: {
    /** フェードイン距離 (px) */
    fadeInOffset: 40,
    /** フェードイン時間 (秒) */
    duration: 0.9,
    /** 標準イージング */
    ease: "power3.out",
    /** スタガー間隔 (秒) */
    stagger: 0.09,
    /** ScrollTrigger の発火位置（要素の上端がビューポートのどこに来たら） */
    start: "top 85%",
    /** パララックスの移動量 (%) */
    parallaxAmount: 12,
    /** カウントアップの時間 (秒) */
    countUpDuration: 1.6,
    /** ローディング演出の最大表示時間 (ミリ秒) — 保険のハードタイムアウト */
    loaderTimeout: 3500,
    /** ローディング演出を出すか（トップページの初回訪問時のみ） */
    loader: true,
  },
} as const;
