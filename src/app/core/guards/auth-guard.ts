import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SqliteService } from '../database/sqlite.service';

export const authGuard: CanActivateFn = async () => {

  const sqliteService = inject(SqliteService);
  const router = inject(Router);

  await sqliteService.initialize();

  const session = await sqliteService.getSessionLocal();

  if (!session) {
    return router.parseUrl('/login');
  }

  const now = new Date();
  const expiresAt = new Date(session.expires_at);

  if (expiresAt <= now) {
    await sqliteService.clearSession();
    return router.parseUrl('/login');
  }

  const context = await sqliteService.getContext(session.id_usuario);

  if (!context) {
    return router.parseUrl('/select-proyecto');
  }

  return true;
};