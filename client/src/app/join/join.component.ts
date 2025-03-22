import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-join-component',
  templateUrl: 'join.component.html',
  styleUrls: ['./join.component.scss'],
  imports: [MatCardModule, RouterLink, MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule]
})


export class JoinComponent {
  constructor(private router: Router) {}

  joinId = "";

}
