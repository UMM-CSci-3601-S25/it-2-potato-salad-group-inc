import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { By } from '@angular/platform-browser';
import { SpecifyComponent } from './specify.component';
import { RouterModule } from '@angular/router';

describe('Specify', () => {

  let component: SpecifyComponent;
  let fixture: ComponentFixture<SpecifyComponent>;
  let de: DebugElement;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatCardModule, SpecifyComponent, RouterModule.forRoot([])]
    });

    fixture = TestBed.createComponent(SpecifyComponent);

    component = fixture.componentInstance; // BannerComponent test instance

    // query for the link (<a> tag) by CSS element selector
    de = fixture.debugElement.query(By.css('.Specify-card'));
    el = de.nativeElement;
  });

  it('It has the basic Specify page text', () => {
    fixture.detectChanges();
    expect(el.textContent).toContain('Specify Game');
    expect(component).toBeTruthy();
  });

});
