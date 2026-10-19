export function scrollToSection(targetId: string, topOffset = 0): void {
  const target = document.getElementById(targetId);
  if (!target) return;

  const headerHeight = document.getElementById("site-header")?.getBoundingClientRect().height ?? 0;
  const top = window.scrollY + target.getBoundingClientRect().top - headerHeight - topOffset;

  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}
