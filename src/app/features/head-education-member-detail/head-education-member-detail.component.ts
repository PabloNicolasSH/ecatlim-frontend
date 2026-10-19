import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {Button} from 'primeng/button';
import {Tooltip} from 'primeng/tooltip';
import {HeadEducationService} from '../../shared/services/head-education.service';
import {HeadEducationMemberHistory} from '../../shared/models/head-education.model';
import {UserAvatarComponent} from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-head-education-member-detail',
  imports: [
    DatePipe,
    RouterLink,
    Button,
    Tooltip,
    UserAvatarComponent
  ],
  templateUrl: './head-education-member-detail.component.html'
})
export class HeadEducationMemberDetailComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly headEducationService = inject(HeadEducationService);

  detail = signal<HeadEducationMemberHistory | null>(null);
  loading = signal<boolean>(true);
  failed = signal<boolean>(false);
  activeStageIndex = signal<number>(0);

  activeStage = computed(() => this.detail()?.stages[this.activeStageIndex()] ?? null);

  activeStageEvents = computed(() => {
    const stage = this.activeStage();
    return this.detail()?.attendedEvents.find(group => group.stageName === stage?.stageName)?.events ?? [];
  });

  ngOnInit(): void {
    this.load();
  }

  load() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    this.failed.set(false);
    this.headEducationService.getMemberHistory(id).subscribe({
      next: detail => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      }
    });
  }

  fullName(): string {
    const member = this.detail()?.member;
    if (!member) return '';
    return [member.name, member.surname].filter(Boolean).join(' ') || member.email;
  }

  initials(): string {
    const member = this.detail()?.member;
    return member ? (member.name ?? member.email).charAt(0).toUpperCase() : '';
  }

  blockClass(status: string): string {
    switch (status) {
      case 'Superada':
        return 'bg-emerald-100 text-emerald-800';
      case 'En Curso':
        return 'bg-[#F3E3C3] text-[#795221]';
      default:
        return 'bg-stone-200 text-stone-700';
    }
  }
}
