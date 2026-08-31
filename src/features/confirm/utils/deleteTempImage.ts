import RNFS from 'react-native-fs';

export function deleteTempImage(uri: string) {
  const path = uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
  RNFS.unlink(path).catch(() => {});
}
