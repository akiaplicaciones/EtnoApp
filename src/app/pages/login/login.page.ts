import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  async signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: this.password
    });

    if (error) {
      this.message = error.message;
      return;
    }

    this.message = 'Login correcto. User ID: ' + data.user?.id;
  }

  async checkSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    this.message = 'Session activa. User ID: ' + data.session.user.id;
  } else {
    this.message = 'No hay sesión activa';
  }
}

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

