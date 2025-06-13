import logo from '../assets/logo.png';

const Header = () => {
  const tagline =
    import.meta.env.MODE === 'production'
      ? 'Your personal chastity & FLR tracker.'
      : 'Built nightly with kink and care.';

  return (
    <header className="flex items-center gap-4 p-4 bg-gray-900 shadow-md border-b border-gray-700">
      <img src={logo} alt="ChastityOS Logo" className="h-10 w-10 rounded-lg" />
      <div>
        <h1 className="text-xl font-bold text-white">ChastityOS</h1>
        <p className="text-sm text-gray-300">{tagline}</p>
      </div>
    </header>
  );
};

export default Header;
