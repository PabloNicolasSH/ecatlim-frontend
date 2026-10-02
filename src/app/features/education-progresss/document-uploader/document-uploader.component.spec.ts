import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {MessageService} from 'primeng/api';

import {DocumentUploaderComponent} from './document-uploader.component';

describe('DocumentUploaderComponent', () => {
  let component: DocumentUploaderComponent;
  let fixture: ComponentFixture<DocumentUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentUploaderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentUploaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('enrollmentId', 1);
    fixture.componentRef.setInput('documents', {personalPlan: null, entityApproval: null});
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows both documents as pending when nothing is uploaded', () => {
    const badges = fixture.nativeElement.querySelectorAll('span.uppercase');
    expect(Array.from(badges).map((b: any) => b.textContent.trim())).toEqual(['Pendiente', 'Pendiente']);
  });
});
