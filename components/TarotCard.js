export default function TarotCard({ name, meaning, index }) {
  // Historic Tarot de Marseille (Lequart, Paris, 1890), public-domain scans
  // hosted by Wikimedia Commons. This iconography is the direct visual lineage
  // of the Marseille deck requested for the site.
  const file = index === 0 ? 'TT_Tarot.png' : `T${index}_Tarot.png`;
  const remote = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${file}`;
  const localJpg = `/cards/${index}.jpg?v=marseille-historic-1`;
  const localSvg = `/cards/${index}.svg?v=marseille-historic-1`;

  return (
    <div className="w-44 h-60 bg-white/10 rounded-xl shadow-lg flex items-center justify-center text-center p-3">
      <img
        src={remote}
        alt={name}
        onError={(e) => {
          const el = e.currentTarget;
          if (el.dataset.fallback !== 'local') {
            el.dataset.fallback = 'local';
            el.src = localJpg;
            return;
          }
          el.onerror = null;
          el.src = localSvg;
        }}
        className="no-rotate w-full h-full object-contain rounded-lg"
        style={{ transform: 'none', rotate: '0deg' }}
        draggable={false}
        referrerPolicy="no-referrer"
      />
      <span className="sr-only">{name}</span>
    </div>
  );
}
