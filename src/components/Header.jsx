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
    <header className="flex items-center gap-6 p-6 bg-theme-bg/80 backdrop-blur-md rounded-xl shadow-xl text-theme-text">
      <img src={logo} alt="ChastityOS Logo" className="h-20 w-20 rounded-xl" />
      <div>
        <h1 className="text-2xl font-bold text-theme-text">ChastityOS</h1>
        <p className="text-sm text-theme-text opacity-80">{tagline}</p>
      </div>
    </header>
  );
};

export default Header;
