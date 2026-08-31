import { useEffect } from 'react';
import { useCameraPermission } from 'react-native-vision-camera';

const usePermission = () => {
  const { hasPermission, canRequestPermission, requestPermission } =
    useCameraPermission();

  const isPermissionPending = !hasPermission && canRequestPermission;
  const isPermissionDenied = !hasPermission && !canRequestPermission;

  useEffect(() => {
    if (isPermissionPending) {
      requestPermission();
    }
  }, [isPermissionPending, requestPermission]);

  return {
    isPermissionPending,
    isPermissionDenied,
  };
};

export default usePermission;
