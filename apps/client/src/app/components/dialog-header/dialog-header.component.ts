import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  host: { class: 'justify-content-center' },
  selector: 'gf-dialog-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialog-header.component.html',
  styleUrls: ['./dialog-header.component.scss'],
  standalone: false
})
export class DialogHeaderComponent {
  @Input() deviceType: string;
  @Input() position: 'center' | 'left' = 'left';
  @Input() title: string;

  @Output() closeButtonClicked = new EventEmitter<void>();

  public onClickCloseButton() {
    this.closeButtonClicked.emit();
  }
}
