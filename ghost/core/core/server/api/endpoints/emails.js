const models = require('../../models');
const tpl = require('@tryghost/tpl');
const errors = require('@tryghost/errors');
const emailService = require('../../services/email-service');
const emailAnalytics = require('../../services/email-analytics');

const messages = {
  emailNotFound: 'Email not found.',
  retryNotAllowed: 'Only failed emails can be retried',
};

const allowedBatchIncludes = ['count.recipients'];
const allowedFailureIncludes = ['member', 'email_recipient'];

module.exports = {
  docName: 'emails',

  browse: {
    options: ['limit', 'fields', 'filter', 'order', 'page'],
    permissions: true,
    async query(frame) {
      return await models.Email.findPage(frame.options);
    },
  },

  read: {
    options: ['fields'],
    validation: {
      options: {
        fields: ['html', 'plaintext', 'subject'],
      },
    },
    data: ['id'],
    permissions: true,
    query(frame) {
      return models.Email.findOne(frame.data, frame.options).then((model) => {
        if (!model) {
          throw new errors.NotFoundError({
            message: tpl(messages.emailNotFound),
          });
        }

        return model;
      });
    },
  },

  retry: {
    data: ['id'],
    permissions: true,
    async query(frame) {
      return await emailService.controller.retryFailedEmail(frame);
    },
  },

  browseBatches: {
    options: ['limit', 'fields', 'filter', 'order', 'page', 'include'],
    data: ['id'],
    validation: {
      options: {
        include: {
          values: allowedBatchIncludes,
        },
      },
    },
    permissions: {
      method: 'browse',
    },
    async query(frame) {
      const filter =
        `email_id:'${frame.data.id}'` +
        (frame.options.filter ? `+(${frame.options.filter})` : '');
      return await models.EmailBatch.findPage({
        ...frame.options,
        filter,
      });
    },
  },

  browseFailures: {
    options: ['limit', 'fields', 'filter', 'order', 'page', 'include'],
    data: ['id'],
    validation: {
      options: {
        include: {
          values: allowedFailureIncludes,
        },
      },
    },
    permissions: {
      method: 'browse',
    },
    async query(frame) {
      const filter =
        `email_id:'${frame.data.id}'` +
        (frame.options.filter ? `+(${frame.options.filter})` : '');
      return await models.EmailRecipientFailure.findPage({
        ...frame.options,
        filter,
      });
    },
  },

  analyticsStatus: {
    permissions: {
      method: 'browse',
    },
    async query() {
      return emailAnalytics.service.getStatus();
    },
  },

  scheduleAnalytics: {
    permissions: {
      method: 'browse',
    },
    data: ['id'],
    async query(frame) {
      const model = await models.Email.findOne(frame.data, frame.options);
      return emailAnalytics.service.schedule({
        begin: model.get('created_at'),
        end: new Date(
          Math.min(
            Date.now() - 60 * 60 * 1000,
            model.get('created_at').getTime() + 24 * 60 * 60 * 1000 * 7
          )
        ),
      });
    },
  },

  cancelScheduledAnalytics: {
    permissions: {
      method: 'browse',
    },
    async query() {
      return emailAnalytics.service.cancelScheduled();
    },
  },
};
