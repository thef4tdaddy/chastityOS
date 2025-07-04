import productionLogo from '../assets/images/logo-production.png';
import nightlyLogo from '../assets/images/logo-nightly.png';

const Header = () => {
  // Use VITE_APP_VARIANT to check if it's the nightly build
  const isNightly = import.meta.env.VITE_APP_VARIANT === 'nightly';

  const tagline = !isNightly // Use !isNightly for production
    ? 'Your personal chastity & FLR tracker.'
    : 'Built nightly with kink and care.';

  const logo = !isNightly ? productionLogo : nightlyLogo; // Use !isNightly for production

  return (
    <header className="flex items-center gap-4 p-4 bg-theme-bg shadow-md text-theme-text">
      <img
        src={logo}
        alt="ChastityOS Logo"
        width={80}
        height={80}
        loading="eager"
        className="h-20 w-20 rounded-lg"
      />
      <div>
        <h1 className="text-xl font-bold text-theme-text">ChastityOS</h1>
        <p className="text-sm text-theme-text">{tagline}</p>
      </div>
    </header>
  );
};

export default Header;
