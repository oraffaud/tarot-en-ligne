export default function Header() {
  return (
    <header className="p-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-yellow-400 text-violet-900 flex items-center justify-center font-bold">
          L
        </div>
        <span className="font-semibold text-lg">Les tarots de Line</span>
      </div>
    </header>
  );
}
