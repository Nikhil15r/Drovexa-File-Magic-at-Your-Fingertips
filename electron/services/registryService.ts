import { app } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export class RegistryService {
  public static async installContextMenu(): Promise<{ success: boolean; message: string }> {
    try {
      const exePath = app.getPath('exe');
      const regKey = `HKCU\\Software\\Classes\\*\\shell\\UniversalFileToolkit`;
      const regCommandKey = `${regKey}\\command`;

      // Set display name and icon
      await execAsync(`reg add "${regKey}" /ve /d "Edit / Convert with Universal File Toolkit" /f`);
      await execAsync(`reg add "${regKey}" /v "Icon" /d "${exePath}" /f`);
      await execAsync(`reg add "${regCommandKey}" /ve /d "\\"${exePath}\\" \\"%1\\"" /f`);

      return {
        success: true,
        message: 'Successfully registered "Universal File Toolkit" in Windows Explorer context menu!',
      };
    } catch (err: any) {
      console.error('Failed to register context menu:', err);
      return {
        success: false,
        message: `Failed to register context menu: ${err.message}`,
      };
    }
  }

  public static async uninstallContextMenu(): Promise<{ success: boolean; message: string }> {
    try {
      const regKey = `HKCU\\Software\\Classes\\*\\shell\\UniversalFileToolkit`;
      await execAsync(`reg delete "${regKey}" /f`);
      return {
        success: true,
        message: 'Successfully removed from Windows Explorer context menu.',
      };
    } catch (err: any) {
      console.error('Failed to unregister context menu:', err);
      return {
        success: false,
        message: `Failed to remove context menu: ${err.message}`,
      };
    }
  }
}
