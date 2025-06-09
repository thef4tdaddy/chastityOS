import { useCallback } from 'react';
import { generateHash } from '../../utils/hash';

export function useKeyholderHandlers(options) {
    const {
        userId,
        saveDataToFirestore,
        setKeyholderName,
        setKeyholderPasswordHash,
        setRequiredKeyholderDurationSeconds,
        setIsKeyholderModeUnlocked,
        setKeyholderMessage,
        setGoalDurationSeconds,
        keyholderPasswordHash,
        keyholderName
    } = options;

    const handleSetKeyholder = useCallback(async (name) => {
        if (!userId) {
            setKeyholderMessage('Error: User ID not available.');
            return null;
        }
        const khName = name.trim();
        if (!khName) {
            setKeyholderMessage('Keyholder name cannot be empty.');
            return null;
        }
        const hash = await generateHash(userId + khName);
        if (!hash) {
            setKeyholderMessage('Error generating Keyholder ID.');
            return null;
        }
        setKeyholderName(khName);
        setKeyholderPasswordHash(hash);
        setRequiredKeyholderDurationSeconds(null);
        setIsKeyholderModeUnlocked(false);
        await saveDataToFirestore({ keyholderName: khName, keyholderPasswordHash: hash, requiredKeyholderDurationSeconds: null });
        const preview = hash.substring(0, 8).toUpperCase();
        setKeyholderMessage(`Keyholder "${khName}" set. Password preview: ${preview}`);
        return preview;
    }, [userId, saveDataToFirestore]);

    const handleClearKeyholder = useCallback(async () => {
        setKeyholderName('');
        setKeyholderPasswordHash(null);
        setRequiredKeyholderDurationSeconds(null);
        setIsKeyholderModeUnlocked(false);
        await saveDataToFirestore({ keyholderName: '', keyholderPasswordHash: null, requiredKeyholderDurationSeconds: null });
        setKeyholderMessage('Keyholder data cleared.');
    }, [saveDataToFirestore]);

    const handleUnlockKeyholderControls = useCallback(async (enteredPasswordPreview) => {
        if (!userId || !keyholderName || !keyholderPasswordHash) {
            setKeyholderMessage('Keyholder not fully set up.');
            return false;
        }
        const expectedPreview = keyholderPasswordHash.substring(0, 8).toUpperCase();
        if (enteredPasswordPreview.toUpperCase() === expectedPreview) {
            setIsKeyholderModeUnlocked(true);
            setKeyholderMessage('Keyholder controls unlocked.');
            return true;
        }
        setIsKeyholderModeUnlocked(false);
        setKeyholderMessage('Incorrect Keyholder password.');
        return false;
    }, [userId, keyholderName, keyholderPasswordHash]);

    const handleLockKeyholderControls = useCallback(() => {
        setIsKeyholderModeUnlocked(false);
        setKeyholderMessage('Keyholder controls locked.');
    }, []);

    const handleSetRequiredDuration = useCallback(async (durationInSeconds) => {
        const newDuration = Number(durationInSeconds);
        if (!isNaN(newDuration) && newDuration >= 0) {
            setRequiredKeyholderDurationSeconds(newDuration);
            await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });
            setKeyholderMessage('Required duration updated.');
            return true;
        }
        setKeyholderMessage('Invalid duration value.');
        return false;
    }, [saveDataToFirestore]);

    const handleSetGoalDuration = useCallback(async (newDurationInSeconds) => {
        const newDuration = newDurationInSeconds === null ? null : Number(newDurationInSeconds);
        if (newDuration === null || (!isNaN(newDuration) && newDuration >= 0)) {
            setGoalDurationSeconds(newDuration);
            await saveDataToFirestore({ goalDurationSeconds: newDuration });
            return true;
        }
        return false;
    }, [saveDataToFirestore]);

    return {
        handleSetKeyholder,
        handleClearKeyholder,
        handleUnlockKeyholderControls,
        handleLockKeyholderControls,
        handleSetRequiredDuration,
        handleSetGoalDuration
    };
}
