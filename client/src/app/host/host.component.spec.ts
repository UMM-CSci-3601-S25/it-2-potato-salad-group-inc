import { DebugElement} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { By } from '@angular/platform-browser';
import { HostComponent } from './host.component';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterModule} from '@angular/router';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Host', () => {

  let component: HostComponent;
  let fixture: ComponentFixture<HostComponent>;
  let de: DebugElement;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatInputModule,
        FormsModule,
        MatIconModule,
        MatTooltipModule,
        MatRadioModule,
        MatButtonModule,
        RouterLink,
        MatCardModule,
        MatOptionModule,
        MatExpansionModule,
        MatDividerModule,
        MatFormFieldModule,
        HostComponent,
        RouterModule.forRoot([])],
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    });

    fixture = TestBed.createComponent(HostComponent);

    component = fixture.componentInstance; // BannerComponent test instance

    // query for the link (<a> tag) by CSS element selector
    de = fixture.debugElement.query(By.css('.host-card'));
    el = de.nativeElement;
  });

  it('It has the basic Host page text', () => {
    fixture.detectChanges();
    expect(el.textContent).toContain('This is a placeholder for the host page!');
    expect(component).toBeTruthy();
  });

});
