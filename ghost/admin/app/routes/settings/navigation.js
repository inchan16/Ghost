import AdminRoute from 'ghost-admin/routes/admin';
import ConfirmUnsavedChangesModal from '../../components/modals/confirm-unsaved-changes';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class NavigationRoute extends AdminRoute {
  @service modals;
  @service settings;

  model() {
    this.settings.reload();
  }

  setupController() {
    this.controller.reset();
  }

  deactivate() {
    this.confirmModal = null;
    this.hasConfirmed = false;
    this.controller.reset();
  }

  @action
  async willTransition(transition) {
    if (this.hasConfirmed) {
      return true;
    }

    transition.abort();

    // wait for any existing confirm modal to be closed before allowing transition
    if (this.confirmModal) {
      return;
    }

    if (this.controller.saveTask?.isRunning) {
      await this.controller.saveTask.last;
    }

    const shouldLeave = await this.confirmUnsavedChanges();

    if (shouldLeave) {
      this.settings.rollbackAttributes();
      this.hasConfirmed = true;
      return transition.retry();
    }
  }

  async confirmUnsavedChanges() {
    if (this.controller.dirtyAttributes) {
      this.confirmModal = this.modals
        .open(ConfirmUnsavedChangesModal)
        .finally(() => {
          this.confirmModal = null;
        });

      return this.confirmModal;
    }

    return true;
  }

  @action
  save() {
    this.controller.send('save');
  }

  buildRouteInfoMetadata() {
    return {
      titleToken: 'Settings - Navigation',
    };
  }
}
