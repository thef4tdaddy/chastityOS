import logo from '../assets/logo.png';

const Header = () => {
  const title = import.meta.env.VITE_APP_HEADER || 'ChastityOS';
  const tagline =
    import.meta.env.VITE_APP_TAGLINE ||
    (import.meta.env.MODE === 'production'
      ? 'Your personal chastity & FLR tracker.'
      : 'Built nightly with kink and care.');

  return (
    <header className="flex items-start gap-4 p-4 bg-gray-900 shadow-md border-b border-gray-700">
      <img src={logo} alt="ChastityOS Logo" className="w-auto h-16 object-contain" />
      <div>
        <h1 className="header-title">{title}</h1>
        <p className="header-tagline">{tagline}</p>
      </div>
    </header>
  );
};

export default Header;
