import { Component } from '@angular/core';
import { Router} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink} from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-host-component',
  templateUrl: 'host.component.html',
  styleUrls: ['./host.component.scss'],
  imports: [
    MatInputModule,
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
    MatFormFieldModule
  ]
})


export class HostComponent {
  constructor(private router: Router, private snackBar: MatSnackBar) {}

}
