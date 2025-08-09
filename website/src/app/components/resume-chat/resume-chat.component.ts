import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { LlmChatService, ChatMessage } from '../../services/llm-chat.service';

@Component({
  selector: 'app-resume-chat',
  templateUrl: './resume-chat.component.html',
  styleUrls: ['./resume-chat.component.scss']
})
export class ResumeChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  private subscription!: Subscription;

  constructor(private llmChatService: LlmChatService) {}

  ngOnInit() {
    this.subscription = this.llmChatService.messages$.subscribe(
      messages => {
        this.messages = messages;
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  async sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading) {
      return;
    }

    const message = this.currentMessage;
    this.currentMessage = '';
    this.isLoading = true;

    try {
      await this.llmChatService.sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom() {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  clearChat() {
    this.llmChatService.clearMessages();
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getCurrentTime(): string {
    return this.formatTime(new Date());
  }
}