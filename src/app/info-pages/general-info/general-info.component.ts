import { Component } from '@angular/core';
import {Divider} from "primeng/divider";

@Component({
  selector: 'app-general-info',
    imports: [
        Divider
    ],
  templateUrl: './general-info.component.html',
  styleUrl: './general-info.component.scss'
})
export class GeneralInfoComponent {
  users: number = 3000;
  educator: number = 2100;
  coordi: number = 900;
  teachers: number = 35;
}
