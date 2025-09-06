export default function TarotCard({ name, meaning, index }) {
  const jpg = `/cards/${index}.jpg?v=upright1`;
  const svg = `/cards/${index}.svg?v=upright1`;
  return (
    <div className="w-44 h-60 bg-white/10 rounded-xl shadow-lg flex items-center justify-center text-center p-3">
      <img
        src={jpg}
        alt={name}
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = svg; }}
        className="no-rotate w-full h-full object-contain rounded-lg"
        style={{ transform: 'none', rotate: '0deg' }}
        draggable={false}
      />
      <span className="sr-only">{name}</span>
    </div>
  );
}
