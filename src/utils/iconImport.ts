/**
 * Centralized icon import utility for ChastityOS
 *
 * This utility provides a consistent interface for importing and using icons
 * from react-icons and lucide-react packages. All icon imports throughout
 * the application must go through this utility to maintain consistency
 * and enable centralized icon management.
 *
 * Usage:
 * import { FaTimes, Lock } from '../utils/iconImport';
 *
 * Policy: Direct imports from react-icons/* or lucide-react/* are prohibited.
 * Use this utility instead for all icon imports.
 */

// React Icons (FA) imports
export {
  FaBook,
  FaBullseye,
  FaCalendar,
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaCog,
  FaDatabase,
  FaDownload,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaFilter,
  FaFire,
  FaGamepad,
  FaGlobe,
  FaHeart,
  FaHistory,
  FaInfo,
  FaKey,
  FaLock,
  FaPalette,
  FaPause,
  FaPlay,
  FaPlus,
  FaSave,
  FaShare,
  FaShieldAlt,
  FaSpinner,
  FaStop,
  FaTasks,
  FaTimes,
  FaTimesCircle,
  FaTint,
  FaTrash,
  FaTrophy,
  FaUnlock,
  FaUpload,
  FaUser,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";

// Lucide React imports (placeholder for future use)
// Add lucide-react icons here as needed:
// export { Lock, X, Plus } from 'lucide-react';

// Note: When adding new icons, update this file to export them
// and ensure they're imported from the correct package.
