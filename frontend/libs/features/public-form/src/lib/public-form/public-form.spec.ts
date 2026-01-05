import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicForm } from './public-form';

describe('PublicForm', () => {
  let component: PublicForm;
  let fixture: ComponentFixture<PublicForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicForm],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
