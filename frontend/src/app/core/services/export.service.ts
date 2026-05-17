import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private http  = inject(HttpClient);
  private i18n  = inject(I18nService);

  downloadCsv(): Observable<Blob> {
    const lang = this.i18n.lang();
    return this.http.get(
      `${environment.apiUrl}/export/csv?lang=${lang}`,
      { responseType: 'blob' }
    );
  }

  downloadPdf(city?: string): Observable<Blob> {
    const lang   = this.i18n.lang();
    const params = new URLSearchParams({ lang });
    if (city) params.set('city', city);
    return this.http.get(
      `${environment.apiUrl}/export/pdf?${params.toString()}`,
      { responseType: 'blob' }
    );
  }

  triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    // FIX: o elemento tem de estar no DOM antes de ser clicado
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private timestamp(): string {
    return new Date().toISOString().replace(/[:T.]/g, '-').slice(0, 19);
  }

  csvFilename(): string {
    return this.i18n.lang() === 'en'
      ? `history_${this.timestamp()}.csv`
      : `historico_${this.timestamp()}.csv`;
  }

  pdfFilename(): string {
    return this.i18n.lang() === 'en'
      ? `report_${this.timestamp()}.pdf`
      : `relatorio_${this.timestamp()}.pdf`;
  }
}
