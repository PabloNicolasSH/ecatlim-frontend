import {Component, computed, inject, input} from '@angular/core';
import {DatePipe, NgClass} from '@angular/common';
import {RecognitionFile, RecognitionMessage, RecognitionRequest} from '../../models/recognition.model';
import {RecognitionService} from '../../services/recognition.service';

interface ConversationEntry {
  message: RecognitionMessage;
  fromStudent: boolean;
  author: string;
  phase: string;
}

/** The whole history of a recognition request as a conversation: comments and files, phase by phase. */
@Component({
  selector: 'app-recognition-conversation',
  imports: [DatePipe, NgClass],
  templateUrl: './recognition-conversation.component.html',
  styleUrl: './recognition-conversation.component.scss'
})
export class RecognitionConversationComponent {

  protected readonly recognitionService = inject(RecognitionService);

  request = input.required<RecognitionRequest>();
  /** 'student' labels the student's own messages as "Tú". */
  viewer = input<'student' | 'staff'>('staff');

  entries = computed<ConversationEntry[]>(() => {
    const request = this.request();
    let submissions = 0;
    return request.messages.map(message => {
      const fromStudent = message.kind === 'SUBMISSION';
      if (fromStudent) submissions++;
      return {
        message,
        fromStudent,
        author: fromStudent && this.viewer() === 'student' ? 'Tú' : fromStudent ? request.userName : message.authorName,
        phase: this.phaseOf(message, submissions)
      };
    });
  });

  download(file: RecognitionFile): void {
    this.recognitionService.downloadFile(file.fileId).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  private phaseOf(message: RecognitionMessage, submissionNumber: number): string {
    switch (message.kind) {
      case 'SUBMISSION': return submissionNumber === 1 ? 'Solicitud inicial' : `Documentación aportada (fase ${submissionNumber})`;
      case 'DOCUMENTATION_REQUESTED': return 'Falta documentación';
      case 'APPROVED': return 'Convalidación aceptada';
      case 'REJECTED': return 'Convalidación rechazada';
    }
  }
}
