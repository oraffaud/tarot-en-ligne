export default function TarotCard({ name, meaning, index }) {
  const src = `/cards-marseille/${index}.jpg?v=marseille1`
  return (
    <div className="w-44 bg-white/10 rounded-xl shadow-lg text-center p-3">
      <div className="h-60 flex items-center justify-center">
        <img
          src={src}
          alt={name}
          className="w-full h-full object-contain rounded-lg"
          style={{ transform: 'none', rotate: '0deg' }}
          draggable={false}
        />
      </div>
      <div className="mt-2 text-sm font-semibold leading-tight">{name}</div>
      <span className="sr-only">
        {meaning?.up ? `Sens principal : ${meaning.up}` : ''}
      </span>
    </div>
  )
}
