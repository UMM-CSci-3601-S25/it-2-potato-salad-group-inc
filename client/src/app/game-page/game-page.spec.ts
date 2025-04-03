import { ComponentFixture, TestBed, tick, flush } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { of, throwError } from 'rxjs';
import { GameComponent } from './game-page';
import { LobbyService } from '../host/lobby.service';
import { MockLobbyService } from 'src/testing/lobby.service.mock';


describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let lobbyService: LobbyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule, HttpClientTestingModule],
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

  it('should increment the round', () => {
    component.round.set(1);
    component.incrementRound();
    expect(component.round()).toBe(2);
  });

  it('should initialize with default username and submission', () => {
    expect(component.username).toBe('Steady Roosevelt');
    expect(component.submission).toBe('');
  });

});
