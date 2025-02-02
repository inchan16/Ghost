import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class PostActivityFeed extends Component {
  @service feature;

  _pageSize = 5;
  _eventTypes = {
    sent: this.feature.get('suppressionList')
      ? ['email_sent_event', 'email_delivered_event', 'email_failed_event']
      : ['email_sent_event'],
    opened: ['email_opened_event'],
    clicked: ['aggregated_click_event'],
    feedback: ['feedback_event'],
    conversion: ['subscription_event', 'signup_event'],
  };

  get getEventTypes() {
    return this._eventTypes[this.args.eventType];
  }

  get pageSize() {
    return this._pageSize;
  }

  get eventType() {
    return this.args.eventType;
  }

  // calculate amount of empty rows which require to keep table height the same for each tab/page
  @action
  getAmountOfStubs({ data }) {
    const stubs = this._pageSize - data.length;

    return new Array(stubs).fill(1);
  }

  @action
  isPreviousButtonDisabled({ hasReachedStart, isLoading }) {
    return hasReachedStart || isLoading;
  }

  @action
  isNextButtonDisabled({ hasReachedEnd, isLoading }) {
    return hasReachedEnd || isLoading;
  }

  @action
  isPaginationNotNeeded({ totalEvents }) {
    return totalEvents <= this._pageSize;
  }

  @action
  areStubsNeeded({ totalEvents }) {
    return totalEvents > this._pageSize || this.args.eventType === 'feedback';
  }
}
