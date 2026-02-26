import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SqliteService } from '../../core/database/sqlite.service';

@Component({
  selector: 'app-select-proyecto',
  templateUrl: './select-proyecto.page.html',
  styleUrls: ['./select-proyecto.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class SelectProyectoPage implements OnInit {

  proyectos: any[] = [];
  idUsuario: string | null = null;

  constructor(
    private sqliteService: SqliteService,
    private router: Router
  ) {}

  async ngOnInit() {

    const session = await this.sqliteService.getSessionLocal();

    if (!session) {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.idUsuario = session.id_usuario;

    this.proyectos = await this.sqliteService.getProyectos();

    console.log('PROYECTOS_CARGADOS', this.proyectos);
  }

  async seleccionarProyecto(id_proyecto: number) {

    if (!this.idUsuario) return;

    await this.router.navigate(['/select-tipo-usuario'], {
      queryParams: {
        id_proyecto: id_proyecto
      }
    });
  }

}