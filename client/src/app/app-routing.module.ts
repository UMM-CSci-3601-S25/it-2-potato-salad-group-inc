import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { JoinComponent } from './join/join.component';
import { HostComponent } from './host/host.component';
import { AddLobbyComponent } from './host/add-lobby.component';
import { GameComponent } from './game-page/game-page';

// Note that the 'users/new' route needs to come before 'users/:id'.
// If 'users/:id' came first, it would accidentally catch requests to
// 'users/new'; the router would just think that the string 'new' is a user ID.
const routes: Routes = [
  {path: '', component: HomeComponent, title: 'Home'},
  {path: 'join', component: JoinComponent, title: 'Join'},
  {path: 'host', component: HostComponent, title: 'Host'},
  {path: 'host/new', component: AddLobbyComponent, title: 'Create Lobby'},
  {path: 'game/:id', component: GameComponent, title: 'Game'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
