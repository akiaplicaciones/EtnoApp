import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { SqliteService } from '../../core/database/sqlite.service';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';



@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonicModule]
})
export class HomePage implements OnInit {

contextActual: any;

  constructor(private sqliteService: SqliteService, private router: Router) { }

async ngOnInit() {
  const session = await this.sqliteService.getSessionLocal();
  if (!session) return;

  this.contextActual = await this.sqliteService.getContext(session.id_usuario);
}

async cambiarProyecto() {
  await this.router.navigateByUrl('/select-proyecto');
}

async cambiarTipoUsuario() {
  if (!this.contextActual) return;

  await this.router.navigate(
    ['/select-tipo-usuario'],
    {
      queryParams: {
        id_proyecto: this.contextActual.id_proyecto
      }
    }
  );
}

async logout() {

  const session = await this.sqliteService.getSessionLocal();
  if (!session) return;

  await this.sqliteService.clearContext(session.id_usuario);
  await this.sqliteService.clearSession();

  await this.router.navigateByUrl('/login', { replaceUrl: true });

}

async abrirNotaPage() {
  await this.router.navigateByUrl('/nota');
}

}