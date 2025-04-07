import { ComponentFixture, TestBed, tick, flush, fakeAsync } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { of, throwError } from 'rxjs';
import { GameComponent } from './game-page';
import { LobbyService } from '../host/lobby.service';
import { MockLobbyService } from 'src/testing/lobby.service.mock';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { provideAnimations} from '@angular/platform-browser/animations';


describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let lobbyService: LobbyService;

  beforeEach(() => {
    TestBed.overrideProvider(LobbyService, { useValue: new MockLobbyService() });
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule, RouterModule.forRoot([]), GameComponent, MatFormFieldControl, MatFormFieldModule, MatSelectModule, MatInputModule, MatCardModule],
      declarations: [],
      providers: [
        { provide: LobbyService, useClass: MockLobbyService },
        { provide: ActivatedRoute,
          useValue: {
            paramMap: of({id: 1, round: 0}),
            snapshot: { params: { id: '1', round: 0 } },
          },
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideAnimations(),
      ],
    }).compileComponents();


    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    lobbyService = TestBed.inject(LobbyService);
    fixture.detectChanges();
  });

  it('should create the component', fakeAsync(() => {
    expect(component).toBeTruthy();
  }
  ));

  it('should handle error when loading game data', fakeAsync(() => {
    const mockError = { message: 'Error loading game', error: { title: 'Error' } };
    spyOn(lobbyService, 'getLobbyById').and.returnValue(throwError(mockError));

    fixture.detectChanges();
    tick();

    expect(component.error().message).toEqual(mockError.error.title);
    expect(component.error().httpResponse).toEqual(mockError.message);
    flush();
  }));

  it('should increment the round', fakeAsync(() => {
    spyOn(component, 'incrementRound').and.callThrough();
    const button = fixture.debugElement.nativeElement.querySelector('.round-increment');
    button.click();
    fixture.detectChanges();
    tick();
    expect(component.incrementRound).toHaveBeenCalled();
    expect(component.round).toBe(1);
  }));

  it('should initialize with default username and submission', fakeAsync(() => {
    expect(component.username).toBe('Steady Roosevelt');
    expect(component.submission).toBe('');
  }));

});

