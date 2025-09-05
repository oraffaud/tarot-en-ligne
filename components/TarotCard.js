            export default function TarotCard({ name }) {
  return (
    <div className="w-44 h-60 bg-white/10 rounded-xl shadow-lg flex items-center justify-center text-center p-3">
      <div>
        <div className="text-sm opacity-70">Arcana</div>
        <div className="text-lg font-semibold mt-2">{name}</div>
        <div className="text-xs opacity-60 mt-3">Signification brève...</div>
      </div>
    </div>
  )
}
