import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { By } from '@angular/platform-browser';
import { HomeComponent } from './home.component';
import { RouterModule } from '@angular/router';

describe('Home', () => {

  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let de: DebugElement;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatCardModule, HomeComponent, RouterModule.forRoot([])],
    });

    fixture = TestBed.createComponent(HomeComponent);

    component = fixture.componentInstance; // BannerComponent test instance

    // query for the link (<a> tag) by CSS element selector
    de = fixture.debugElement.query(By.css('.start-screen'));
    el = de.nativeElement;
  });

  it('It loads each element (e.g., buttons, title)', () => {
    fixture.detectChanges();
    expect(el.textContent).toContain('Card Game Simulator');
    expect(el.textContent).toContain('Host Game');
    expect(el.textContent).toContain('Join Game');
    expect(component).toBeTruthy();
  });

  it('Information box opens', fakeAsync(() => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    spyOn(component, 'openDialog').and.callThrough();
    const button = fixture.debugElement.nativeElement.querySelector('.info-fab');
    button.click();
    fixture.detectChanges();
    tick();
    expect(component.openDialog).toHaveBeenCalled();
  }));

})
