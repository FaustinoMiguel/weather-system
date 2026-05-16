import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private http: HttpClient) {}

  downloadCsv(): void {
    this.http.get(`${environment.apiUrl}/export/csv`, { responseType: 'blob' }).subscribe(blob => {
      this.triggerDownload(blob, `historico_${this.timestamp()}.csv`);
    });
  }

  downloadPdf(city?: string): void {
    const url = city
      ? `${environment.apiUrl}/export/pdf?city=${encodeURIComponent(city)}`
      : `${environment.apiUrl}/export/pdf`;
    this.http.get(url, { responseType: 'blob' }).subscribe(blob => {
      this.triggerDownload(blob, `relatorio_${this.timestamp()}.pdf`);
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private timestamp(): string {
    return new Date().toISOString().replace(/[:T.]/g, '-').slice(0, 19);
  }
}
