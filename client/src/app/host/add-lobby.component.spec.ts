import { Location } from '@angular/common';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, flush, tick, waitForAsync } from '@angular/core/testing';
import { AbstractControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router, RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MockLobbyService } from 'src/testing/lobby.service.mock';
import { AddLobbyComponent } from './add-lobby.component';
import { LobbyService } from './lobby.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';


describe('AddLobbyComponent', () => {
  let addLobbyComponent: AddLobbyComponent;
  let addLobbyForm: FormGroup;
  let fixture: ComponentFixture<AddLobbyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.overrideProvider(LobbyService, { useValue: new MockLobbyService() });
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        BrowserAnimationsModule,
        RouterModule,
        AddLobbyComponent
      ],
      providers: [{ provide: LobbyService, useValue: new MockLobbyService() }]
    }).compileComponents().catch(error => {
      expect(error).toBeNull();
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLobbyComponent);
    addLobbyComponent = fixture.componentInstance;
    fixture.detectChanges();
    addLobbyForm = addLobbyComponent.addLobbyForm;
    expect(addLobbyForm).toBeDefined();
    expect(addLobbyForm.controls).toBeDefined();
  });

  // Not terribly important; if the component doesn't create
  // successfully that will probably blow up a lot of things.
  // Including it, though, does give us confidence that our
  // our component definitions don't have errors that would
  // prevent them from being successfully constructed.
  it('should create the component and form', () => {
    expect(addLobbyComponent).toBeTruthy();
    expect(addLobbyForm).toBeTruthy();
  });

  // Confirms that an initial, empty form is *not* valid, so
  // people can't submit an empty form.
  it('form should be invalid when empty', () => {
    expect(addLobbyForm.valid).toBeFalsy();
  });

  describe('The name field', () => {
    let nameControl: AbstractControl;

    beforeEach(() => {
      nameControl = addLobbyComponent.addLobbyForm.controls.lobbyName;
    });

    it('should not allow empty names', () => {
      nameControl.setValue('');
      expect(nameControl.valid).toBeFalsy();
    });

    it('should be fine with "Chris Smith"', () => {
      nameControl.setValue('Chris Smith');
      expect(nameControl.valid).toBeTruthy();
    });

    it('should fail on single character names', () => {
      nameControl.setValue('x');
      expect(nameControl.valid).toBeFalsy();
      // Annoyingly, Angular uses lowercase 'l' here
      // when it's an upper case 'L' in `Validators.minLength(2)`.
      expect(nameControl.hasError('minlength')).toBeTruthy();
    });

    // In the real world, you'd want to be pretty careful about
    // setting upper limits on things like name lengths just
    // because there are people with really long names.
    it('should fail on really long names', () => {
      nameControl.setValue('x'.repeat(100));
      expect(nameControl.valid).toBeFalsy();
      // Annoyingly, Angular uses lowercase 'l' here
      // when it's an upper case 'L' in `Validators.maxLength(2)`.
      expect(nameControl.hasError('maxlength')).toBeTruthy();
    });

    it('should allow digits in the name', () => {
      nameControl.setValue('Bad2Th3B0ne');
      expect(nameControl.valid).toBeTruthy();
    });

    it('should fail if we provide an "existing" name', () => {
      // We're assuming that "abc123" and "123abc" already
      // exist so we disallow them.
      nameControl.setValue('abc123');
      expect(nameControl.valid).toBeFalsy();
      expect(nameControl.hasError('existingName')).toBeTruthy();

      nameControl.setValue('123abc');
      expect(nameControl.valid).toBeFalsy();
      expect(nameControl.hasError('existingName')).toBeTruthy();
    });
  });

  describe('getErrorMessage()', () => {
    it('should return the correct error message', () => {
      // The type statement is needed to ensure that `controlName` isn't just any
      // random string, but rather one of the keys of the `addLobbyValidationMessages`
      // map in the component.
      const controlName: keyof typeof addLobbyComponent.addLobbyValidationMessages = 'lobbyName';
      addLobbyComponent.addLobbyForm.get(controlName).setErrors({'required': true});
      expect(addLobbyComponent.getErrorMessage(controlName)).toEqual('Lobby Name is required');

      // We don't need the type statement here because we're not using the
      // same (previously typed) variable. We could use a `let` and the type statement
      // if we wanted to create a new variable, though.
    });

    it('should return "Unknown error" if no error message is found', () => {
      // The type statement is needed to ensure that `controlName` isn't just any
      // random string, but rather one of the keys of the `addLobbyValidationMessages`
      // map in the component.
      const controlName: keyof typeof addLobbyComponent.addLobbyValidationMessages = 'lobbyName';
      addLobbyComponent.addLobbyForm.get(controlName).setErrors({'unknown': true});
      expect(addLobbyComponent.getErrorMessage(controlName)).toEqual('Unknown error');
    });
  });
});

describe('AddLobbyComponent#submitForm()', () => {
  let component: AddLobbyComponent;
  let fixture: ComponentFixture<AddLobbyComponent>;
  let lobbyService: LobbyService;
  let location: Location;

  beforeEach(() => {
    TestBed.overrideProvider(LobbyService, { useValue: new MockLobbyService() });
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule,
        MatSnackBarModule,
        MatCardModule,
        MatSelectModule,
        MatInputModule,
        RouterModule.forRoot([{ path: 'game/1', component: AddLobbyComponent }]),
        BrowserAnimationsModule,
        AddLobbyComponent],
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    }).compileComponents().catch(error => {
      expect(error).toBeNull();
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLobbyComponent);
    component = fixture.componentInstance;
    lobbyService = TestBed.inject(LobbyService);
    location = TestBed.inject(Location);
    // We need to inject the router and the HttpTestingController, but
    // never need to use them. So, we can just inject them into the TestBed
    // and ignore the returned values.
    TestBed.inject(Router);
    TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  beforeEach(() => {
    // Set up the form with valid values.
    // We don't actually have to do this, but it does mean that when we
    // check that `submitForm()` is called with the right arguments below,
    // we have some reason to believe that that wasn't passing "by accident".
    component.addLobbyForm.controls.lobbyName.setValue('Chris Smith');
  });

  // The `fakeAsync()` wrapper is necessary because the `submitForm()` method
  // calls `navigate()` on the router, which is an asynchronous operation, and we
  // need to wait (using `tick()`) for that to complete before we can check the
  // new location.
  it('should call addLobby() and handle success response', fakeAsync(() => {
    // This use of `fixture.ngZone.run()` is necessary to avoid a warning when
    // we run the tests. `submitForm()` calls `.navigate()` when it succeeds,
    // and that apparently needs to be run in a separate Angular zone (a concept
    // I don't claim to understand well). The suggestion in this lengthy
    // thread: https://github.com/angular/angular/issues/25837
    // is to wrap the relevant part of the test in an Angular zone, and that
    // does seem to resolve the issue. Some people seem to feel that this is
    // actually a workaround for a bug in Angular, but I'm not clear enough
    // on the issues to know if that's true or not. - Nic
    fixture.ngZone.run(() => {
      // "Spy" on the `.addLobby()` method in the lobby service. Here we basically
      // intercept any calls to that method and return a canned response ('1').
      // This means we don't have to worry about the details of the `.addLobby()`,
      // or actually have a server running to receive the HTTP request that
      // `.addLobby()` would typically generate. Note also that the particular values
      // we set up in our form (e.g., 'Chris Smith') are actually ignored
      // thanks to our `spyOn()` call.
      const addLobbySpy = spyOn(lobbyService, 'addLobby').and.returnValue(of('1'));
      component.submitForm();
      // Check that `.addLobby()` was called with the form's values which we set
      // up above.
      expect(addLobbySpy).toHaveBeenCalledWith(component.addLobbyForm.value);
      // Wait for the router to navigate to the new page. This is necessary since
      // navigation is an asynchronous operation.
      tick();
      // Now we can check that the router actually navigated to the right place.
      expect(location.path()).toBe('/game/1');
      // Flush any pending microtasks. This is necessary to ensure that the
      // timer generated by `fakeAsync()` completes before the test finishes.
      flush();
    });
  }));

  // This doesn't need `fakeAsync()`, `tick()`, or `flush() because the
  // error case doesn't navigate to another page. It just displays an error
  // message in the snackbar. So, we don't need to worry about the asynchronous
  // nature of navigation.
  it('should call addLobby() and handle error response', () => {
    // Save the original path so we can check that it doesn't change.
    const path = location.path();
    // A canned error response to be returned by the spy.
    const errorResponse = { status: 500, message: 'Server error' };
    // "Spy" on the `.addLobby()` method in the lobby service. Here we basically
    // intercept any calls to that method and return the error response
    // defined above.
    const addLobbySpy = spyOn(lobbyService, 'addLobby')
      .and
      .returnValue(throwError(() => errorResponse));
    component.submitForm();
    // Check that `.addLobby()` was called with the form's values which we set
    // up above.
    expect(addLobbySpy).toHaveBeenCalledWith(component.addLobbyForm.value);
    // Confirm that we're still at the same path.
    expect(location.path()).toBe(path);
  });


  it('should call addLobby() and handle error response for illegal lobby', () => {
    // Save the original path so we can check that it doesn't change.
    const path = location.path();
    // A canned error response to be returned by the spy.
    const errorResponse = { status: 400, message: 'Illegal lobby error' };
    // "Spy" on the `.addLobby()` method in the lobby service. Here we basically
    // intercept any calls to that method and return the error response
    // defined above.
    const addLobbySpy = spyOn(lobbyService, 'addLobby')
      .and
      .returnValue(throwError(() => errorResponse));
    component.submitForm();
    // Check that `.addLobby()` was called with the form's values which we set
    // up above.
    expect(addLobbySpy).toHaveBeenCalledWith(component.addLobbyForm.value);
    // Confirm that we're still at the same path.
    expect(location.path()).toBe(path);
  });

  it('should call addLobby() and handle unexpected error response if it arises', () => {
    // Save the original path so we can check that it doesn't change.
    const path = location.path();
    // A canned error response to be returned by the spy.
    const errorResponse = { status: 404, message: 'Not found' };
    // "Spy" on the `.addLobby()` method in the lobby service. Here we basically
    // intercept any calls to that method and return the error response
    // defined above.
    const addLobbySpy = spyOn(lobbyService, 'addLobby')
      .and
      .returnValue(throwError(() => errorResponse));
    component.submitForm();
    // Check that `.addLobby()` was called with the form's values which we set
    // up above.
    expect(addLobbySpy).toHaveBeenCalledWith(component.addLobbyForm.value);
    // Confirm that we're still at the same path.
    expect(location.path()).toBe(path);
  });
});
