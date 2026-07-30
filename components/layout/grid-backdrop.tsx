export function GridBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-void-950">
      <div className="absolute inset-0 bg-hud-grid bg-grid opacity-[0.18] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_35%,transparent_100%)]" />
      <div className="absolute inset-0 bg-radial-fade opacity-70" />
      <div className="absolute -left-40 top-1/3 h-[560px] w-[560px] rounded-full bg-neon-cyan/[0.08] blur-[140px]" />
      <div className="absolute -right-40 bottom-0 h-[560px] w-[560px] rounded-full bg-neon-magenta/[0.07] blur-[140px]" />
    </div>
  );
}
