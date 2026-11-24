/**
 * Drive service — intentionally NOT implemented in v0.1.
 *
 * Google Drive access in the abbasapplio workflow happens INSIDE the
 * official Applio Colab notebook: the notebook's "Mount Drive" cell mounts
 * the user's Drive with Google's own authorization flow, and its "Sync
 * with Google Drive" cell syncs models to the `ApplioBackup` folder.
 *
 * This app deliberately does NOT call the Drive API directly:
 * - It would need an OAuth client, token storage and a consent screen.
 * - The notebook already covers the real need (model backup/sync).
 * - The narrowest useful scope (drive.file) would still add attack
 *   surface for no v0.1 benefit.
 *
 * If a future version needs direct Drive access (e.g. importing a .pth
 * straight from Drive), implement it here behind this interface, using
 * Google Identity Services + the Drive REST API with the `drive.file`
 * scope only, and document the change in docs/COLAB_INTEGRATION.md.
 */

export interface DriveFileRef {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

/** Not implemented in v0.1 — see module docstring. Always throws. */
export function listDriveFiles(): Promise<DriveFileRef[]> {
  return Promise.reject(
    new Error(
      'Drive API is not integrated in abbasapplio v0.1. Use the official Applio notebook to sync models with Google Drive.',
    ),
  );
}
