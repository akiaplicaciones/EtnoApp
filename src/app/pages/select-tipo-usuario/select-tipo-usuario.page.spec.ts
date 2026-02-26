import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectTipoUsuarioPage } from './select-tipo-usuario.page';

describe('SelectTipoUsuarioPage', () => {
  let component: SelectTipoUsuarioPage;
  let fixture: ComponentFixture<SelectTipoUsuarioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectTipoUsuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
