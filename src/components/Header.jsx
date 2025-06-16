import productionLogo from '../assets/images/logo-production.png';
import nightlyLogo from '../assets/images/logo-nightly.png';

const Header = () => {
  const isProduction = import.meta.env.MODE === 'production';

  const tagline = isProduction
    ? 'Your personal chastity & FLR tracker.'
    : 'Built nightly with kink and care.';

  const logo = isProduction ? productionLogo : nightlyLogo;

  return (
    <header className="flex items-center gap-4 p-4 bg-theme-bg shadow-md text-theme-text">
      <img src={logo} alt="ChastityOS Logo" className="h-24 w-24 rounded-lg" />
      <div>
        <h1 className="text-xl font-bold text-theme-text">ChastityOS</h1>
        <p className="text-sm text-theme-text">{tagline}</p>
      </div>
    </header>
  );
};

export default Header;