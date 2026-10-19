import { app } from 'electron';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { AppSettings } from '../../src/types';

export class SettingsService {
  private static getSettingsPath(): string {
    const userData = app.getPath('userData');
    return path.join(userData, 'settings.json');
  }

  public static readonly defaultSettings: AppSettings = {
    theme: 'dark',
    accentColor: '#0ea5e9',
    defaultSaveBesideOriginal: true,
    customSaveDirectory: '',
    openFolderAfterSave: true,
    defaultJpegQuality: 90,
    defaultWebpQuality: 85,
    menuLayout: 'radial',
    showAnimations: true,
  };

  public static async getSettings(): Promise<AppSettings> {
    try {
      const p = this.getSettingsPath();
      if (!fsSync.existsSync(p)) {
        await this.saveSettings(this.defaultSettings);
        return this.defaultSettings;
      }
      const data = await fs.readFile(p, 'utf-8');
      return { ...this.defaultSettings, ...JSON.parse(data) };
    } catch (err) {
      console.warn('Failed to load settings, using defaults', err);
      return this.defaultSettings;
    }
  }

  public static async saveSettings(newSettings: Partial<AppSettings>): Promise<boolean> {
    try {
      const p = this.getSettingsPath();
      const current = await this.getSettings();
      const merged = { ...current, ...newSettings };
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, JSON.stringify(merged, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Failed to save settings:', err);
      return false;
    }
  }
}
