import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SqliteService } from './core/database/sqlite.service';


// Importa los componentes standalone de Ionic
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [RouterModule, IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private sqliteService: SqliteService) {} //Inicia base de datos al iniciar app 

async ngOnInit() {
  try {
    await this.sqliteService.initialize();
  } catch (error) {
    console.error('ERROR_INICIALIZANDO_SQLITE', error);
  }
}
}