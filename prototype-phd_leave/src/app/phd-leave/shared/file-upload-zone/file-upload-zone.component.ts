import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload-zone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload-zone.component.html',
  styleUrl: './file-upload-zone.component.scss',
})
export class FileUploadZoneComponent {
  @Input() accept = '.pdf,.jpg,.jpeg,.png';
  @Input() maxSizeMB = 5;
  @Output() fileSelected = new EventEmitter<File>();
  @Output() fileRemoved = new EventEmitter<void>();

  selectedFile: File | null = null;
  isDragOver = false;
  errorMessage = '';

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
      input.value = ''; // reset so same file can be re-selected
    }
  }

  private handleFile(file: File): void {
    this.errorMessage = '';

    // Validate type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Only PDF, JPG, or PNG files are allowed.';
      return;
    }

    // Validate size
    if (file.size > this.maxSizeMB * 1024 * 1024) {
      this.errorMessage = `File size must be under ${this.maxSizeMB} MB.`;
      return;
    }

    this.selectedFile = file;
    this.fileSelected.emit(file);
  }

  removeFile(): void {
    this.selectedFile = null;
    this.errorMessage = '';
    this.fileRemoved.emit();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
