import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { SqliteService } from '../../core/database/sqlite.service';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-nota',
  templateUrl: './nota.page.html',
  styleUrls: ['./nota.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonicModule]
})
export class NotaPage implements OnInit {

  constructor(private sqliteService: SqliteService) { }

  ngOnInit() {
  }


titulo: string = ''; //Guardado de notas
cuerpo: string = '';
message: string = '';
notas: any[] = []; //Muestra de notas


//Guardado de notas

async guardarNota() {

  await this.sqliteService.initialize();

  const session = await this.sqliteService.getSessionLocal();
  if (!session) {
    this.message = 'No hay sesión activa';
    return;
  }

  const context = await this.sqliteService.getContext(session.id_usuario);
  if (!context) {
    this.message = 'No hay contexto seleccionado';
    return;
  }

  const ID_TIPO_NOTA = 3; // según catálogo sincronizado

  await this.sqliteService.createNotaLocal(
    this.titulo,
    this.cuerpo,
    session.id_usuario,
    ID_TIPO_NOTA
  );

  this.message = 'Nota guardada offline';
  this.titulo = '';
  this.cuerpo = '';

  await this.cargarNotas(); //Llama a cargar notas para que se actualicen las que ya se habian cargado previo a esta nueva nota
}

//Muestra de notas


async ionViewWillEnter() {
  await this.cargarNotas();
}

async cargarNotas() {
  await this.sqliteService.initialize();
  this.notas = await this.sqliteService.getNotasLocales();
}


}
