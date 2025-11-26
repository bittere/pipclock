interface CpsDisplayProps {
  cps: number
}

export default function CpsDisplay({ cps }: CpsDisplayProps) {
  return (
    <div
      className={`fixed top-5 right-5 bg-[var(--cps-bg)] text-[var(--cps-text)] px-6 py-3 rounded-3xl font-bold text-lg transition-all z-[1000] shadow-lg pointer-events-none ${
        cps > 0 ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-[120%] scale-75'
      }`}
    >
      <div className="text-2xl">{cps} CPS</div>
    </div>
  )
}
