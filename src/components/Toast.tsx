export default function Toast() {
  return (
    <div
      id="toastNotification"
      className="fixed bottom-10 right-10 bg-gradient-to-br from-[var(--text-color)] to-[rgba(58,58,63,0.9)] text-white px-6 py-4 rounded-2xl opacity-0 transform translate-y-[120%] scale-75 transition-all z-[10000] shadow-lg pointer-events-none max-w-sm"
    >
      <div className="font-semibold text-sm mb-2">Message</div>
      <div className="text-sm opacity-95">Content</div>
    </div>
  )
}
