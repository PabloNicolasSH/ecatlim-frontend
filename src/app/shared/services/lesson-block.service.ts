import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {LessonBlock} from '../models/lesson-block.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LessonBlockService {

  protected readonly http = inject(HttpClient);

  createLessonBlocks(lessonBlocks: LessonBlock[]){
    return this.http.post<LessonBlock[]>(`${environment.apiUrl}/lesson-block/admin/add`, lessonBlocks);
  }

  updateLessonBlock(id: number, lessonBlock: LessonBlock) {
    return this.http.put<void>(`${environment.apiUrl}/lesson-block/${id}`, lessonBlock);
  }

  getAll() {
    return this.http.get<LessonBlock[]>(`${environment.apiUrl}/lesson-block/all`);
  }
}
