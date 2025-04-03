import { ComponentFixture, TestBed, tick, flush } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { of, throwError } from 'rxjs';
import { GameComponent } from './game-page';
import { LobbyService } from '../host/lobby.service';
import { MockLobbyService } from 'src/testing/lobby.service.mock';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let lobbyService: LobbyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule, RouterModule.forRoot([])],
      declarations: [],
      providers: [
        { provide: LobbyService, useClass: MockLobbyService },
        { provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: (key: string) => (key === 'id' ? '1' : null),
            }),
          },
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();


    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    lobbyService = TestBed.inject(LobbyService);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  }
  );

  it('should handle error when loading game data', () => {
    const mockError = { message: 'Error loading game', error: { title: 'Error' } };
    spyOn(lobbyService, 'getLobbyById').and.returnValue(throwError(mockError));

    fixture.detectChanges();
    tick();

    expect(component.error().message).toEqual(mockError.error.title);
    expect(component.error().httpResponse).toEqual(mockError.message);
    flush();
  });

  // it('should increment the round', () => {
  //   component.round.set(1);
  //   expect(component.game().round).toBe(2);
  // });

  it('should initialize with default username and submission', () => {
    expect(component.username).toBe('Steady Roosevelt');
    expect(component.submission).toBe('');
  });

});

