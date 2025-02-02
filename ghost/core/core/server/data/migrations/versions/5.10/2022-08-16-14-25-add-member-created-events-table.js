const { addTable } = require('../../utils');

module.exports = addTable('members_created_events', {
  id: { type: 'string', maxlength: 24, nullable: false, primary: true },
  created_at: { type: 'dateTime', nullable: false },
  member_id: {
    type: 'string',
    maxlength: 24,
    nullable: false,
    references: 'members.id',
    cascadeDelete: true,
  },
  attribution_id: { type: 'string', maxlength: 24, nullable: true },
  attribution_type: { type: 'string', maxlength: 50, nullable: true },
  attribution_url: { type: 'string', maxlength: 2000, nullable: true },
  source: { type: 'string', maxlength: 50, nullable: false },
});
