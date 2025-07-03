import { useContext } from 'react';
import { ActiveUserContext } from '../contexts/ActiveUserContext';

export const useActiveUser = () => useContext(ActiveUserContext);