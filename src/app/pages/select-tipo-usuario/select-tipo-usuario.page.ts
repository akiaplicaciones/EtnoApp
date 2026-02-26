import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SqliteService } from '../../core/database/sqlite.service';

@Component({
  selector: 'app-select-tipo-usuario',
  templateUrl: './select-tipo-usuario.page.html',
  styleUrls: ['./select-tipo-usuario.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class SelectTipoUsuarioPage implements OnInit {

  tiposUsuario: any[] = [];
  idUsuario: string | null = null;
  idProyecto: number | null = null;

  constructor(
    private sqliteService: SqliteService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {

    const session = await this.sqliteService.getSessionLocal();

    if (!session) {
      await this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.idUsuario = session.id_usuario;

    const params = this.route.snapshot.queryParams;
    this.idProyecto = Number(params['id_proyecto']);

    if (!this.idProyecto) {
      await this.router.navigateByUrl('/select-proyecto', { replaceUrl: true });
      return;
    }

    this.tiposUsuario = await this.sqliteService.getTipoUsuario();

    console.log('TIPOS_USUARIO_CARGADOS', this.tiposUsuario);
  }

  async seleccionarTipoUsuario(id_tipo_usuario: number) {

    if (!this.idUsuario || !this.idProyecto) return;

    await this.sqliteService.saveContext(
      this.idUsuario,
      this.idProyecto,
      id_tipo_usuario
    );

    await this.router.navigateByUrl('/home', { replaceUrl: true });
  }

}