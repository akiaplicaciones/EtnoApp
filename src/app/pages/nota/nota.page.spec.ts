import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotaPage } from './nota.page';

describe('NotaPage', () => {
  let component: NotaPage;
  let fixture: ComponentFixture<NotaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NotaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
