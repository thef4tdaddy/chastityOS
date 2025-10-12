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
  FaArrowLeft,
  FaArrowRight,
  FaAward,
  FaBan,
  FaBatteryHalf,
  FaBook,
  FaBug,
  FaBullseye,
  FaCalendar,
  FaCalendarAlt,
  FaChartBar,
  FaCheck,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClipboard,
  FaClipboardList,
  FaClock,
  FaCloud,
  FaCog,
  FaComment,
  FaCopy,
  FaCrown,
  FaDatabase,
  FaDownload,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaFilter,
  FaFire,
  FaGamepad,
  FaGavel,
  FaGlobe,
  FaGoogle,
  FaHeart,
  FaHistory,
  FaHome,
  FaImage,
  FaInfo,
  FaKey,
  FaLightbulb,
  FaLink,
  FaList,
  FaLock,
  FaMedal,
  FaMinus,
  FaMoon,
  FaPalette,
  FaPaperPlane,
  FaPause,
  FaPlay,
  FaPlus,
  FaPrayingHands,
  FaQrcode,
  FaSave,
  FaSearch,
  FaShare,
  FaShieldAlt,
  FaSpinner,
  FaStar,
  FaStickyNote,
  FaStop,
  FaSun,
  FaSync,
  FaRedo,
  FaTasks,
  FaTimes,
  FaTimesCircle,
  FaExclamationCircle,
  FaTint,
  FaTrash,
  FaTrophy,
  FaUnlock,
  FaUpload,
  FaUser,
  FaUserPlus,
  FaUsers,
  FaUserShield,
  FaWifi,
} from "react-icons/fa";

// Material Design Icons
export {
  MdWifiOff as FaWifiSlash, // Alias for compatibility
} from "react-icons/md";

// Lucide React imports (placeholder for future use)
// Add lucide-react icons here as needed:
// export { Lock, X, Plus } from 'lucide-react';

// Note: When adding new icons, update this file to export them
// and ensure they're imported from the correct package.
