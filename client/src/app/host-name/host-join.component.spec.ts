import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { By } from '@angular/platform-browser';
import { HostJoinComponent } from './host-join.component';
import { RouterModule } from '@angular/router';

describe('Join', () => {

  let component: HostJoinComponent;
  let fixture: ComponentFixture<HostJoinComponent>;
  let de: DebugElement;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatCardModule, HostJoinComponent, RouterModule.forRoot([])]
    });

    fixture = TestBed.createComponent(HostJoinComponent);

    component = fixture.componentInstance; // BannerComponent test instance

    // query for the link (<a> tag) by CSS element selector
    de = fixture.debugElement.query(By.css('.join-card'));
    el = de.nativeElement;
  });

  it('It has the basic Join page text', () => {
    fixture.detectChanges();
    expect(el.textContent).toContain('Join Game');
    expect(component).toBeTruthy();
  });

});
