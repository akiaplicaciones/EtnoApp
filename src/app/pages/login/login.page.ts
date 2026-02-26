import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SqliteService } from '../../core/database/sqlite.service';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';
import { supabase } from '../../core/supabase.client';
import { ApiService } from '../../core/api/api.service'; //railway
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonButton
  ],
  templateUrl: './login.page.html'
})

export class LoginPage {

  email: string = '';
  password: string = '';
  message: string = '';

  constructor(private sqliteService: SqliteService, private apiService: ApiService,
    private router: Router){}

async signIn() {

  const { data, error } = await supabase.auth.signInWithPassword({
    email: this.email,
    password: this.password
  });

  if (error || !data.session || !data.user) {
    this.message = error?.message || 'Login failed';
    return;
  }

  const id_usuario = data.user.id;
  const token = data.session.access_token;
  const expires_at = new Date(data.session.expires_at! * 1000).toISOString();

  await this.sqliteService.initialize();

  await this.sqliteService.saveSession(
    id_usuario,
    token,
    expires_at
  );

  // ----- SYNC CON RAILWAY -----

  const syncData: any = await this.apiService.syncLogin(token);


  console.log('SYNC_DATA', syncData);  //Pruebas en consola logcat
  console.log('SYNC_DATA_FULL', JSON.stringify(syncData));

  if (!syncData.ok) {
    this.message = 'Error sincronizando con servidor';
    return;
  }

  const proyectos = syncData.proyectos_visibles || [];

  // Inserta proyectos nuevos
  for (const p of proyectos) {
    await this.sqliteService.insertProyecto(
      p.id_proyecto,
      p.nombre_proyecto,
      '1',
      p.id_ubicacion,
      p.id_empresa
    );
  }

// Inserta tipos de usuario

  const tipo_usuario = syncData.tipo_usuario || [];

await this.sqliteService.clearTipoUsuario();

for (const t of tipo_usuario) {
  await this.sqliteService.insertTipoUsuario(
    t.id_tipo_usuario,
    t.nombre_tipo
  );
}

// Inserta tipos de archivo

const tipo_archivo = syncData.tipo_archivo || [];

await this.sqliteService.clearTipoArchivo();

for (const ta of tipo_archivo) {
  await this.sqliteService.insertTipoArchivo(
    ta.id_tipo_archivo,
    ta.nombre_tipo_archivo
  );
}

await this.router.navigateByUrl('/select-proyecto', { replaceUrl: true });

}




  
//Pruebas de subida de archivo a storage

selectedFile: File | null = null;

onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) {
    this.selectedFile = null;
    return;
  }

  this.selectedFile = input.files[0];
}

async uploadSelectedFile() {
  this.message = '';

  if (!this.selectedFile) {
    this.message = 'No file selected';
    return;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    this.message = 'No authenticated user';
    return;
  }

  const userId = userData.user.id;

  const file = this.selectedFile;
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${userId}/test/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('EtnoApp')
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) {
    this.message = uploadError.message;
    return;
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from('EtnoApp')
    .createSignedUrl(path, 60);

  if (signedError) {
    this.message = signedError.message;
    return;
  }

  this.message = signed.signedUrl;

}

}

