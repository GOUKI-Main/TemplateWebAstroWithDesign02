/**
 * サイト全体のスクロール演出（GSAP + ScrollTrigger + SplitText）
 *
 * 設計方針
 * - CSS 側のリビール要素は「素の状態が可視」。<html> に .anim-on が付いた時だけ隠れる。
 *   このモジュールが読み込めなかった場合でもコンテンツは必ず読める。
 * - .anim-on が無い（JS 無効相当 / prefers-reduced-motion）場合は一切動かさない。
 * - 数値は src/content/design.ts の animation を唯一の定義元とする。
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { design } from "../content/design";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * このモジュールが実行できた＝GSAP の読み込みに成功した合図。
 * Layout の非常用タイマーはこの印が無いときに .anim-on を外し、
 * 伏せてあった要素を全て表示に戻す。
 */
document.documentElement.setAttribute("data-anim-ready", "");

const A = design.animation;

gsap.defaults({ duration: A.duration, ease: A.ease });

/** モバイルのアドレスバー伸縮で 100vh が変わるたびに refresh するのを防ぐ */
ScrollTrigger.config({ ignoreMobileResize: true });

/** 演出を動かしてよいか（<html class="anim-on"> はヘッダーのインラインscriptが付ける） */
export const animationsEnabled = (): boolean =>
  document.documentElement.classList.contains("anim-on");

/* ------------------------------------------------------------------ *
 * スクロールロック
 * ローダーとモバイルメニューの両方が使うので、参照カウントで競合を防ぐ。
 * ------------------------------------------------------------------ */
let lockCount = 0;

export function lockScroll(): void {
  lockCount += 1;
  if (lockCount === 1) {
    document.documentElement.classList.add("is-locked");
  }
}

export function unlockScroll(): void {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.documentElement.classList.remove("is-locked");
  }
}

/* ------------------------------------------------------------------ *
 * 汎用リビール（既存の .fade-in / .fade-in-left / .fade-in-right）
 * ------------------------------------------------------------------ */

/** .stagger-N クラスを遅延（秒）として読み取る。markup を変えずに既存の演出意図を活かす */
function delayOf(el: Element): number {
  const matched = /stagger-(\d)/.exec(el.className);
  return matched ? Number(matched[1]) * A.stagger : 0;
}

function initReveals(): void {
  const targets = gsap.utils
    .toArray<HTMLElement>(".fade-in, .fade-in-left, .fade-in-right")
    // Hero とローダーは専用タイムラインで扱うので除外
    .filter((el) => !el.closest("[data-hero], .loader"));

  targets.forEach((el) => {
    const x = el.classList.contains("fade-in-left")
      ? -A.fadeInOffset
      : el.classList.contains("fade-in-right")
        ? A.fadeInOffset
        : 0;
    const y = x === 0 ? A.fadeInOffset : 0;

    gsap.set(el, { x, y });

    gsap.to(el, {
      opacity: 1,
      x: 0,
      y: 0,
      delay: delayOf(el),
      scrollTrigger: { trigger: el, start: A.start, once: true },
      onComplete: () => {
        // 合成レイヤーを解放し、子要素の position:fixed 等を壊さないよう transform を消す
        el.classList.add("is-revealed");
        gsap.set(el, { clearProps: "transform" });
      },
    });
  });
}

/* ------------------------------------------------------------------ *
 * セクション見出し（連番ヘアライン → 漢字 → 英字）
 * ------------------------------------------------------------------ */
function initHeadings(): void {
  gsap.utils.toArray<HTMLElement>("[data-heading]").forEach((heading) => {
    const index = heading.querySelector("[data-heading-index]");
    const kanji = heading.querySelector("[data-heading-kanji]");
    const en = heading.querySelector("[data-heading-en]");

    const tl = gsap.timeline({
      scrollTrigger: { trigger: heading, start: A.start, once: true },
    });

    if (index) {
      tl.fromTo(index, { opacity: 0, x: -12 }, { opacity: 1, x: 0 }, 0);
      // ヘアラインが左から伸びる
      tl.fromTo(
        index,
        { "--rule-scale": 0 },
        { "--rule-scale": 1, duration: A.duration * 1.2 },
        0.05,
      );
    }
    if (kanji) {
      tl.fromTo(kanji, { opacity: 0, y: 28 }, { opacity: 1, y: 0 }, 0.12);
    }
    if (en) {
      tl.fromTo(
        en,
        { opacity: 0, letterSpacing: "0.45em" },
        { opacity: 1, letterSpacing: "0.1em" },
        0.26,
      );
    }
  });
}

/* ------------------------------------------------------------------ *
 * 行単位のテキストリビール（SplitText）
 * 日本語は分かち書きが無いが、SplitText は実際の折返しを見て行を作るため
 * type:"lines" は正しく動く。chars は禁則処理を壊すので長い和文には使わない。
 * ------------------------------------------------------------------ */
function initSplitLines(): void {
  gsap.utils.toArray<HTMLElement>("[data-split-lines]").forEach((el) => {
    // スクリーンリーダー向けに元のテキストを保持
    if (!el.getAttribute("aria-label")) {
      el.setAttribute("aria-label", el.textContent?.trim() ?? "");
    }

    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      linesClass: "split-line",
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          opacity: 0,
          stagger: 0.08,
          duration: A.duration,
          ease: A.ease,
          scrollTrigger: { trigger: el, start: A.start, once: true },
        });
      },
    });
  });
}

/* ------------------------------------------------------------------ *
 * パララックス / マスクリビール
 * ------------------------------------------------------------------ */
function initParallax(): void {
  gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
    const amount = Number(el.dataset.parallax) || A.parallaxAmount;
    gsap.fromTo(
      el,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement ?? el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  });

  // 横方向にゆっくり流れる大きな英字（.full-bleed__large-text）
  gsap.utils.toArray<HTMLElement>("[data-drift]").forEach((el) => {
    const amount = Number(el.dataset.drift) || 8;
    gsap.fromTo(
      el,
      { xPercent: amount },
      {
        xPercent: -amount,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("section") ?? el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  });
}

function initMaskReveals(): void {
  gsap.utils.toArray<HTMLElement>(".mask-reveal").forEach((el) => {
    gsap.to(el, {
      clipPath: "inset(0 0 0% 0)",
      duration: A.duration * 1.4,
      ease: "power2.inOut",
      scrollTrigger: { trigger: el, start: A.start, once: true },
    });

    // 内側の画像を軽く寄せてから戻す
    const inner = el.querySelector<HTMLElement>("img");
    if (inner) {
      gsap.fromTo(
        inner,
        { scale: 1.12 },
        {
          scale: 1,
          duration: A.duration * 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: A.start, once: true },
          // インラインの transform を残すと CSS のホバー拡大を上書きしてしまう
          onComplete: () => gsap.set(inner, { clearProps: "transform" }),
        },
      );
    }
  });
}

/* ------------------------------------------------------------------ *
 * 数値カウントアップ
 * SSR 時点で実数を出力しておき、.anim-on の時だけ 0 に戻してから回す。
 * これで JS 無効でも正しい数字が読める。
 * ------------------------------------------------------------------ */
function initCountUp(): void {
  gsap.utils.toArray<HTMLElement>("[data-count-to]").forEach((el) => {
    const target = Number(el.dataset.countTo);
    if (!Number.isFinite(target)) return;

    const counter = { value: 0 };
    el.textContent = "0";

    gsap.to(counter, {
      value: target,
      duration: A.countUpDuration,
      ease: "power2.out",
      snap: { value: 1 },
      onUpdate: () => {
        el.textContent = String(Math.round(counter.value));
      },
      scrollTrigger: { trigger: el, start: A.start, once: true },
    });
  });
}

/* ------------------------------------------------------------------ *
 * ヒーロー（ローダー完了、またはローダーが出ない場合は即時に再生）
 * ------------------------------------------------------------------ */
let heroPlayed = false;

/**
 * ヒーローの行分割が済んだ合図。
 * ローダーの完了は initAnimations（フォント待ち）より先に来ることがあるため、
 * playHero は準備完了を待ってから再生する。
 */
let markHeroPrepared: () => void = () => {};
const heroPrepared = new Promise<void>((resolve) => {
  markHeroPrepared = resolve;
});

export async function playHero(): Promise<void> {
  if (heroPlayed) return;
  heroPlayed = true;

  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero || !animationsEnabled()) return;

  // 準備が終わらない場合でも、待ち続けてヒーローが出ないままにはしない
  await Promise.race([
    heroPrepared,
    new Promise<void>((resolve) => window.setTimeout(resolve, 2000)),
  ]);

  const q = gsap.utils.selector(hero);
  const tl = gsap.timeline({ defaults: { ease: A.ease } });

  // CSS 側が .anim-on で opacity:0 にしているため、from ではなく fromTo で
  // 終了値を明示する（from だと「現在値 = 0」が終了値になり、出てこない）
  tl.fromTo(
    q("[data-hero-logo]"),
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 1 },
  )
    .set(q("[data-hero-copy]"), { opacity: 1 }, 0)
    .fromTo(
      q("[data-hero-copy] .split-line"),
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, stagger: 0.1, duration: 1.1 },
      "-=0.6",
    )
    .fromTo(
      q("[data-hero-sub]"),
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.9 },
      "-=0.7",
    )
    .fromTo(
      q("[data-hero-scroll]"),
      { opacity: 0 },
      { opacity: 1, duration: 0.8 },
      "-=0.5",
    );

  // スクロール誘導の上下ループ
  gsap.to(q("[data-hero-scroll]"), {
    y: 8,
    duration: 1.2,
    ease: "sine.inOut",
    repeat: -1,
    yoyo: true,
    delay: 1.6,
  });

  await tl;
}

/** ヒーローのコピーだけは先に行分割しておく（ローダー中に裏で準備しておくため） */
function prepareHero(): void {
  const copy = document.querySelector<HTMLElement>("[data-hero-copy]");

  if (copy) {
    if (!copy.getAttribute("aria-label")) {
      copy.setAttribute("aria-label", copy.textContent?.trim() ?? "");
    }

    SplitText.create(copy, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
    });
  }

  markHeroPrepared();
}

/* ------------------------------------------------------------------ *
 * 初期化
 * ------------------------------------------------------------------ */
export async function initAnimations(): Promise<void> {
  if (!animationsEnabled()) return;

  // 日本語 Web フォントの読み込みでレイアウトがずれるため、
  // 行分割とトリガー位置の計算は必ずフォント確定後に行う。
  try {
    await document.fonts.ready;
  } catch {
    /* fonts API が無い環境ではそのまま進める */
  }

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    prepareHero();
    initReveals();
    initHeadings();
    initSplitLines();
    initParallax();
    initMaskReveals();
    initCountUp();
  });

  // 遅延読み込み画像で高さが確定した後にトリガー位置を取り直す
  window.addEventListener("load", () => ScrollTrigger.refresh());

  // リサイズのたびに再計算すると重いので間引く
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
  });
}

export { gsap, ScrollTrigger };
