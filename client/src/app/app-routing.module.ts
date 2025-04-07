import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { JoinComponent } from './join/join.component';
import { AddLobbyComponent } from './host/add-lobby.component';
import { GameComponent } from './game-page/game-page';
import { SpecifyComponent } from './specify-lobby/specify.component';
import { HostJoinComponent } from './host-name/host-join.component';

// Note that the 'users/new' route needs to come before 'users/:id'.
// If 'users/:id' came first, it would accidentally catch requests to
// 'users/new'; the router would just think that the string 'new' is a user ID.
const routes: Routes = [
  {path: '', component: HomeComponent, title: 'Home'},
  {path: 'join', component: JoinComponent, title: 'Join'},
  {path: 'host/new/:uid', component: AddLobbyComponent, title: 'Create Lobby'},
  {path: 'game/:id/:uid', component: GameComponent, title: 'Game'},
  {path: 'specify/:uid', component: SpecifyComponent, title: 'Specify Lobby'},
  {path: 'specify/:id/:uid', component: SpecifyComponent, title: 'Specify Lobby'},
  {path: 'host', component: HostJoinComponent, title: 'Create Username'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
