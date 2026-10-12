export type InstallPlatform = 'ios' | 'android' | 'desktop';
export function installPlatform(userAgent: string, maxTouchPoints = 0): InstallPlatform {
  if (/iPad|iPhone|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1))
    return 'ios';
  return /Android/i.test(userAgent) ? 'android' : 'desktop';
}
