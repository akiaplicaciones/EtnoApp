import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectProyectoPage } from './select-proyecto.page';

describe('SelectProyectoPage', () => {
  let component: SelectProyectoPage;
  let fixture: ComponentFixture<SelectProyectoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectProyectoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
