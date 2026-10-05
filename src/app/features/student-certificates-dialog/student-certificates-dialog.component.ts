import {Component, effect, inject, input, model, signal} from '@angular/core';
import {NgClass} from '@angular/common';
import {Observable} from 'rxjs';
import {Dialog} from 'primeng/dialog';
import {Button} from 'primeng/button';
import {MessageService} from 'primeng/api';
import {CertificateService} from '../../shared/services/certificate.service';
import {Block, Enrollment} from '../../shared/models/enrollment.model';
import {StudentSummary} from '../../shared/models/training-people.model';

@Component({
  selector: 'app-student-certificates-dialog',
  imports: [
    NgClass,
    Dialog,
    Button
  ],
  templateUrl: './student-certificates-dialog.component.html'
})
export class StudentCertificatesDialogComponent {

  private readonly certificateService = inject(CertificateService);
  private readonly messageService = inject(MessageService);

  private static readonly MAX_SIZE_BYTES = 8 * 1024 * 1024;

  student = input<StudentSummary | null>(null);
  visible = model<boolean>(false);

  enrollments = signal<Enrollment[]>([]);
  loading = signal<boolean>(false);
  busy = signal<string | null>(null);
  selectedBlockIds = signal<number[]>([]);

  constructor() {
    effect(() => {
      const student = this.student();
      if (this.visible() && student) {
        this.load(student.id);
      }
    });
  }

  private load(userId: number): void {
    this.loading.set(true);
    this.selectedBlockIds.set([]);
    this.certificateService.getUserProgress(userId).subscribe({
      next: enrollments => {
        this.enrollments.set(enrollments);
        this.loading.set(false);
      },
      error: () => {
        this.enrollments.set([]);
        this.loading.set(false);
      }
    });
  }

  private reload(): void {
    const student = this.student();
    if (!student) return;
    this.certificateService.getUserProgress(student.id).subscribe(enrollments => this.enrollments.set(enrollments));
  }

  private run(key: string, action: () => Observable<unknown>, success: string, reload = true): void {
    this.busy.set(key);
    action().subscribe({
      next: () => {
        this.busy.set(null);
        this.messageService.add({severity: 'success', summary: 'Hecho', detail: success});
        if (reload) this.reload();
      },
      error: () => this.busy.set(null)
    });
  }

  allBlocksPassed(enrollment: Enrollment): boolean {
    const blocks = enrollment.modules.flatMap(m => m.blocks);
    return blocks.length > 0 && blocks.every(b => b.status === 'Superada');
  }

  isPassed(block: Block): boolean {
    return block.status === 'Superada';
  }

  togglePassed(block: Block): void {
    const student = this.student();
    if (!student) return;
    const passed = !this.isPassed(block);
    if (!passed) {
      this.selectedBlockIds.update(ids => ids.filter(id => id !== block.id));
    }
    this.run(`passed-${block.id}`, () => this.certificateService.setBlockPassed(student.id, block.id, passed),
      passed ? `Bloque ${block.code} marcado como superado.` : `Bloque ${block.code} marcado como no superado.`);
  }

  toggleSelected(block: Block): void {
    this.selectedBlockIds.update(ids => ids.includes(block.id) ? ids.filter(id => id !== block.id) : [...ids, block.id]);
  }

  sendAttendance(): void {
    const student = this.student();
    if (!student) return;
    this.busy.set('attendance');
    this.certificateService.sendAttendanceCertificate(student.id).subscribe({
      next: summary => {
        this.busy.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Certificado de asistencia enviado',
          detail: `${summary.events} evento(s) y ${summary.lessonBlocks} bloque(s) formativo(s).`
        });
      },
      error: () => this.busy.set(null)
    });
  }

  sendBlockCertificates(): void {
    const student = this.student();
    if (!student || this.selectedBlockIds().length === 0) return;
    this.run('blocks', () => this.certificateService.sendBlockCertificates(student.id, this.selectedBlockIds()),
      'Se ha avisado a la persona de que sus certificados de bloque están disponibles.', false);
  }

  onStageCertificateSelected(event: Event, enrollment: Enrollment): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.messageService.add({severity: 'warn', summary: 'Formato no válido', detail: 'El certificado debe ser un PDF.'});
      return;
    }
    if (file.size > StudentCertificatesDialogComponent.MAX_SIZE_BYTES) {
      this.messageService.add({severity: 'warn', summary: 'Archivo demasiado grande', detail: 'El tamaño máximo es 8MB.'});
      return;
    }
    this.run(`upload-${enrollment.id}`, () => this.certificateService.uploadStageCertificate(enrollment.id, file),
      'Certificado de etapa subido.');
  }

  completeStage(enrollment: Enrollment): void {
    this.run(`complete-${enrollment.id}`, () => this.certificateService.completeStage(enrollment.id), 'Etapa marcada como completada.');
  }

  sendStageCertificate(enrollment: Enrollment): void {
    this.run(`send-${enrollment.id}`, () => this.certificateService.sendStageCertificate(enrollment.id),
      'Se ha enviado el diploma y el certificado de etapa.', false);
  }
}
